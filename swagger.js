// swagger.js

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Backend API',
            version: '1.0.0',
            description: 'API Documentation for the backend app',
        },
        servers: [
            {
                url: 'http://localhost:3000', // Change to your production URL when deployed
                description: 'Local server'
            },
        ],
    },
    apis: ['./server.js'], // path where your Express API routes are defined
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
