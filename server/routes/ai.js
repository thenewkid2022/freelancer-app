const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TimeEntry = require('../models/TimeEntry');

// KI-Analyse der Aktivität
router.post('/analyze', auth, async (req, res) => {
  try {
    const { description } = req.body;
    
    // Hier würde die eigentliche KI-Analyse stattfinden
    // Für den Anfang simulieren wir die Analyse
    const suggestions = {
      categories: ['Entwicklung', 'Design', 'Beratung'],
      tags: ['Frontend', 'React', 'UI/UX'],
      similarProjects: [
        {
          projectNumber: 'PRJ-001',
          name: 'Ähnliches Projekt 1',
          similarity: 85
        },
        {
          projectNumber: 'PRJ-002',
          name: 'Ähnliches Projekt 2',
          similarity: 75
        }
      ]
    };

    res.json(suggestions);
  } catch (error) {
    console.error('Fehler bei der KI-Analyse:', error);
    res.status(500).json({ message: 'Fehler bei der KI-Analyse' });
  }
});

// Vorschläge für ein Projekt
router.get('/suggestions/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Hier würde die KI-basierte Vorschlagsgenerierung stattfinden
    // Für den Anfang simulieren wir die Vorschläge
    const suggestions = {
      estimatedDuration: 120, // in Minuten
      recommendedTags: ['Entwicklung', 'Frontend'],
      similarActivities: [
        {
          description: 'Ähnliche Aktivität 1',
          duration: 90
        },
        {
          description: 'Ähnliche Aktivität 2',
          duration: 150
        }
      ]
    };

    res.json(suggestions);
  } catch (error) {
    console.error('Fehler beim Abrufen der Vorschläge:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Vorschläge' });
  }
});

// Kategorisierung einer Aktivität
router.post('/categorize', auth, async (req, res) => {
  try {
    const { description } = req.body;
    
    // Hier würde die KI-basierte Kategorisierung stattfinden
    // Für den Anfang simulieren wir die Kategorisierung
    const categories = {
      mainCategory: 'Entwicklung',
      subCategories: ['Frontend', 'React'],
      confidence: 0.85
    };

    res.json(categories);
  } catch (error) {
    console.error('Fehler bei der Kategorisierung:', error);
    res.status(500).json({ message: 'Fehler bei der Kategorisierung' });
  }
});

module.exports = router; 