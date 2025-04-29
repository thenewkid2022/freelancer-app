const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS Konfiguration
app.use(cors({
  origin: [
    'https://freelancer-app-chi.vercel.app',
    'https://freelancer-39f6z9gzd-christian-von-ows-projects.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ... rest of the code ... 