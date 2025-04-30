const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Hilfsfunktion für Zeitformatierung
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
  
  return parts.join(' ');
};

// Gefilterte Statistiken abrufen
router.get('/filtered', auth, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'daily', project, tags } = req.query;
    
    // Filter erstellen
    const filter = {
      userId: new mongoose.Types.ObjectId(req.user._id)
    };

    if (startDate) {
      filter.startTime = { $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.endTime = { $lte: new Date(endDate) };
    }
    if (project) {
      filter.project = { $regex: project, $options: 'i' };
    }
    if (tags) {
      filter.tags = { $in: tags.split(',') };
    }

    // Aggregation Pipeline
    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'daily' ? '%Y-%m-%d' : 
                     groupBy === 'weekly' ? '%Y-%U' : '%Y-%m',
              date: '$startTime'
            }
          },
          totalSeconds: { $sum: '$duration' },
          totalEntries: { $sum: 1 },
          projects: { $addToSet: '$project' },
          entries: {
            $push: {
              startTime: '$startTime',
              endTime: '$endTime',
              duration: '$duration',
              project: '$project',
              description: '$description'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalSeconds: 1,
          totalHours: { 
            $round: [{ $divide: ['$totalSeconds', 3600] }, 2]
          },
          totalMinutes: { 
            $round: [{ $divide: ['$totalSeconds', 60] }, 0]
          },
          totalEntries: 1,
          averageMinutesPerEntry: {
            $round: [
              { $divide: [{ $divide: ['$totalSeconds', 60] }, '$totalEntries'] },
              0
            ]
          },
          projects: 1,
          entries: {
            $map: {
              input: '$entries',
              as: 'entry',
              in: {
                startTime: '$$entry.startTime',
                endTime: '$$entry.endTime',
                duration: '$$entry.duration',
                durationFormatted: {
                  $function: {
                    body: formatDuration.toString(),
                    args: ['$$entry.duration'],
                    lang: 'js'
                  }
                },
                project: '$$entry.project',
                description: '$$entry.description'
              }
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ];

    const stats = await TimeEntry.aggregate(pipeline);

    // Gesamtstatistiken berechnen
    const totalStats = stats.reduce((acc, curr) => ({
      totalSeconds: acc.totalSeconds + curr.totalSeconds,
      totalEntries: acc.totalEntries + curr.totalEntries,
      projects: [...new Set([...acc.projects, ...curr.projects])]
    }), { totalSeconds: 0, totalEntries: 0, projects: [] });

    const summary = {
      totalHours: parseFloat((totalStats.totalSeconds / 3600).toFixed(2)),
      totalMinutes: Math.round(totalStats.totalSeconds / 60),
      totalSeconds: totalStats.totalSeconds,
      totalEntries: totalStats.totalEntries,
      averageMinutesPerEntry: totalStats.totalEntries > 0 
        ? Math.round((totalStats.totalSeconds / 60) / totalStats.totalEntries)
        : 0,
      totalProjects: totalStats.projects.length,
      durationFormatted: formatDuration(totalStats.totalSeconds),
      dateRange: {
        start: stats.length > 0 ? stats[0].date : null,
        end: stats.length > 0 ? stats[stats.length - 1].date : null
      }
    };

    // CSV-Export
    if (req.query.format === 'csv') {
      const csv = [
        ['Datum', 'Stunden', 'Minuten', 'Sekunden', 'Einträge', 'Durchschnitt (Min)', 'Projekte'],
        ...stats.map(stat => [
          stat.date,
          stat.totalHours,
          stat.totalMinutes,
          stat.totalSeconds,
          stat.totalEntries,
          stat.averageMinutesPerEntry,
          stat.projects.join('; ')
        ])
      ].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=zeiterfassung-statistiken.csv');
      return res.send(csv);
    }

    res.json({
      stats,
      summary
    });
  } catch (err) {
    console.error('Fehler beim Abrufen der Statistiken:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 