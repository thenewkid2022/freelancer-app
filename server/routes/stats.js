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
    console.log('Statistik-Anfrage empfangen');
    
    if (!req.user?._id) {
      console.error('Kein Benutzer gefunden:', req.user);
      return res.status(401).json({ 
        success: false,
        message: 'Nicht authentifiziert',
        debug: { user: req.user }
      });
    }

    // 2. Parameter-Extraktion
    const { startDate, endDate, groupBy = 'daily' } = req.query;
    console.log('Parameter erhalten:', { 
      startDate, 
      endDate, 
      groupBy,
      userId: req.user._id 
    });

    // 3. Filter-Erstellung
    const filter = {
      userId: new mongoose.Types.ObjectId(req.user._id)  // Konvertierung wieder hinzugefügt
    };

    try {
      if (startDate) filter.startTime = { $gte: new Date(startDate) };
      if (endDate) filter.endTime = { $lte: new Date(endDate) };
    } catch (dateError) {
      console.error('Fehler bei der Datums-Konvertierung:', dateError);
      return res.status(400).json({ message: 'Ungültiges Datumsformat' });
    }

    console.log('Angewendeter Filter:', JSON.stringify(filter, null, 2));

    // Zuerst prüfen, ob überhaupt Einträge existieren
    const entriesCount = await TimeEntry.countDocuments(filter);
    console.log(`Gefundene Einträge vor Aggregation: ${entriesCount}`);

    if (entriesCount === 0) {
      return res.json({
        success: true,
        stats: [],
        summary: {
          totalEntries: 0,
          totalHours: 0,
          totalMinutes: 0,
          daysTracked: 0,
          dateRange: { start: null, end: null }
        },
        debug: { filter, entriesCount }
      });
    }

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

    console.log('Pipeline erstellt:', JSON.stringify(pipeline, null, 2));

    // 5. Aggregation ausführen
    const stats = await TimeEntry.aggregate(pipeline);
    console.log('Aggregation abgeschlossen, Ergebnisse:', stats.length);
    console.log('Erste 3 Ergebnisse:', JSON.stringify(stats.slice(0, 3), null, 2));

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

    console.log('Zusammenfassung erstellt:', JSON.stringify(summary, null, 2));

    // 7. Antwort senden
    res.json({
      success: true,
      stats,
      summary,
      debug: {
        filter,
        entriesCount,
        pipelineStages: pipeline.length
      }
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
      error: err.message,
      debug: {
        errorType: err.name,
        errorMessage: err.message
      }
    });
  }
});

module.exports = router; 