const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Freelancer API',
      version: '1.0.0',
      description: 'API-Dokumentation für die Freelancer-App',
      contact: {
        name: 'API Support',
        email: 'support@freelancer-app.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Entwicklungsserver'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './routes/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 