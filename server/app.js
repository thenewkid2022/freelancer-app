const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS Konfiguration
app.use(cors({
  origin: [
    'https://freelancer-app-git-main-thenewkid2022.vercel.app',
    'https://freelancer-app-thenewkid2022.vercel.app',
    'https://freelancer-app.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ... rest of the code ... 