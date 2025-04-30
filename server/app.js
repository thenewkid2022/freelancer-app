const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const aiRoutes = require('./routes/ai');

const app = express();

// ... rest of the code ... 

// Routen registrieren
app.use('/api/ai', aiRoutes);

// ... rest of the code ... 