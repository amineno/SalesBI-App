import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.js'],
        include: ['src/**/*.test.{js,jsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: [
                'src/routes/ProtectedRoute.jsx',
                'src/pages/Login.jsx',
                'src/pages/Register.jsx',
                'src/pages/ForgotPassword.jsx',
                'src/pages/ResetPassword.jsx',
                'src/pages/Unauthorized.jsx'
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
