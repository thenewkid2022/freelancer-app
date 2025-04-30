const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Hilfsfunktion für Zeitformatierung
const formatDuration = (seconds) => {
  if (!seconds) return '0s';
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
    // 1. Basis-Validierung
    if (!req.user?._id) {
      console.error('Kein Benutzer gefunden:', req.user);
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    // 2. Parameter-Extraktion
    const { startDate, endDate, groupBy = 'daily' } = req.query;
    console.log('Parameter erhalten:', { startDate, endDate, groupBy });

    // 3. Filter-Erstellung
    const filter = {
      userId: new mongoose.Types.ObjectId(req.user._id)
    };

    try {
      if (startDate) filter.startTime = { $gte: new Date(startDate) };
      if (endDate) filter.endTime = { $lte: new Date(endDate) };
    } catch (dateError) {
      console.error('Fehler bei der Datums-Konvertierung:', dateError);
      return res.status(400).json({ message: 'Ungültiges Datumsformat' });
    }

    console.log('Filter erstellt:', filter);

    // 4. Basis-Aggregation
    const pipeline = [
      { 
        $match: filter 
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$startTime'
            }
          },
          totalSeconds: { $sum: '$duration' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalHours: { 
            $round: [{ $divide: ['$totalSeconds', 3600] }, 2]
          },
          totalMinutes: { 
            $round: [{ $divide: ['$totalSeconds', 60] }, 0]
          },
          count: 1
        }
      },
      { 
        $sort: { 
          date: 1 
        } 
      }
    ];

    console.log('Pipeline erstellt, starte Aggregation...');

    // 5. Aggregation ausführen
    const stats = await TimeEntry.aggregate(pipeline);
    console.log('Aggregation abgeschlossen, Anzahl Ergebnisse:', stats.length);

    // 6. Zusammenfassung erstellen
    const summary = {
      totalEntries: stats.reduce((sum, day) => sum + day.count, 0),
      totalHours: stats.reduce((sum, day) => sum + day.totalHours, 0),
      totalMinutes: stats.reduce((sum, day) => sum + day.totalMinutes, 0),
      daysTracked: stats.length,
      dateRange: {
        start: stats.length > 0 ? stats[0].date : null,
        end: stats.length > 0 ? stats[stats.length - 1].date : null
      }
    };

    // 7. Antwort senden
    res.json({
      success: true,
      stats,
      summary
    });

  } catch (err) {
    console.error('Detaillierter Fehler in der Statistik-Route:', {
      message: err.message,
      stack: err.stack,
      query: req.query,
      userId: req.user?._id
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Fehler beim Abrufen der Statistiken',
      error: err.message
    });
  }
});

module.exports = router; 