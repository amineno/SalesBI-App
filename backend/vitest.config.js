const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: [
                'controllers/authController.js',
                'controllers/productController.js',
                'controllers/customerController.js',
                'controllers/orderController.js',
                'controllers/userController.js',
                'middleware/authMiddleware.js'
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80
            }
        }
    }
});
