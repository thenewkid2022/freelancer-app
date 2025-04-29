const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Gefilterte Statistiken abrufen
router.get('/filtered', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const { startDate, endDate, groupBy = 'daily', project } = req.query;

    // Cache-Header setzen um 304-Antworten zu verhindern
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    // Filter erstellen
    const filter = { userId: userId };
    if (startDate) {
      filter.startTime = filter.startTime || {};
      filter.startTime.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.startTime = filter.startTime || {};
      filter.startTime.$lte = new Date(endDate);
    }
    if (project) {
      filter.project = project;
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
          totalHours: { 
            $sum: { 
              $round: [
                { $divide: ['$duration', 3600] },
                3  // Auf 3 Dezimalstellen runden
              ]
            } 
          },
          totalEntries: { $sum: 1 },
          projects: { $addToSet: '$project' },
          descriptions: { $push: '$description' },
          startTimes: { $push: '$startTime' },
          endTimes: { $push: '$endTime' },
          durations: { $push: '$duration' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalHours: { $round: ['$totalHours', 2] },
          totalEntries: 1,
          projectCount: { $size: '$projects' },
          projects: 1,
          descriptions: 1,
          startTimes: 1,
          endTimes: 1,
          durations: 1,
          averageDuration: { $round: [{ $avg: '$durations' }, 2] },
          minDuration: { $min: '$durations' },
          maxDuration: { $max: '$durations' }
        }
      },
      { $sort: { date: 1 } }
    ];

    const stats = await TimeEntry.aggregate(pipeline);

    // Zusammenfassung berechnen
    const summary = {
      totalHours: stats.reduce((acc, curr) => acc + curr.totalHours, 0),
      totalEntries: stats.reduce((acc, curr) => acc + curr.totalEntries, 0),
      totalProjects: new Set(stats.flatMap(s => s.projects)).size,
      dateRange: {
        start: stats.length > 0 ? stats[0].date : null,
        end: stats.length > 0 ? stats[stats.length - 1].date : null
      },
      averageHoursPerDay: stats.length > 0 ? 
        (stats.reduce((acc, curr) => acc + curr.totalHours, 0) / stats.length).toFixed(2) : 0,
      averageEntriesPerDay: stats.length > 0 ? 
        (stats.reduce((acc, curr) => acc + curr.totalEntries, 0) / stats.length).toFixed(2) : 0,
      mostActiveProject: stats.length > 0 ? 
        [...new Set(stats.flatMap(s => s.projects))]
          .map(project => ({
            project,
            hours: stats.reduce((acc, curr) => 
              acc + (curr.projects.includes(project) ? curr.totalHours : 0), 0)
          }))
          .sort((a, b) => b.hours - a.hours)[0] : null
    };

    // CSV-Export
    if (req.query.format === 'csv') {
      const csv = [
        ['Datum', 'Stunden', 'Einträge', 'Projekte', 'Beschreibungen', 'Durchschnittliche Dauer', 'Minimale Dauer', 'Maximale Dauer'],
        ...stats.map(stat => [
          stat.date,
          stat.totalHours,
          stat.totalEntries,
          stat.projects.join('; '),
          stat.descriptions.join('; '),
          stat.averageDuration,
          stat.minDuration,
          stat.maxDuration
        ])
      ].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=statistiken.csv');
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