const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SalesBI Enterprise API',
            version: '2.0.0',
            description: 'Next Generation Enterprise Sales BI & Management API',
            contact: {
                name: 'API Support',
                url: 'https://salesbi.enterprise/support',
                email: 'api@salesbi.enterprise'
            },
        },
        servers: [
            {
                url: `http://localhost:${env.port}/api`,
                description: 'Development Server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./routes/*.js', './controllers/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
