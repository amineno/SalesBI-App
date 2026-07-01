import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Unauthorized from './Unauthorized';

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockForgotPassword = vi.fn();
const mockResetPassword = vi.fn();
const mockNavigate = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        register: mockRegister,
        forgotPassword: mockForgotPassword,
        resetPassword: mockResetPassword
    })
}));

vi.mock('react-hot-toast', () => ({
    toast: {
        success: toastSuccess,
        error: toastError
    }
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

const renderWithRouter = (ui, initialEntries = ['/']) => render(
    <MemoryRouter initialEntries={initialEntries}>
        <Routes>
            <Route path="/" element={ui} />
            <Route path="/login" element={<div>Login Route</div>} />
            <Route path="/register" element={<div>Register Route</div>} />
            <Route path="/forgot-password" element={<div>Forgot Route</div>} />
            <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
    </MemoryRouter>
);

describe('auth pages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('submits login requests', async () => {
        mockLogin.mockResolvedValueOnce({});
        renderWithRouter(<Login />);

        await userEvent.type(screen.getByPlaceholderText('Email address'), 'user@example.com');
        await userEvent.type(screen.getByPlaceholderText('Password'), 'Password123!');
        await userEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'Password123!');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('submits registration requests', async () => {
        mockRegister.mockResolvedValueOnce({});
        renderWithRouter(<Register />);

        await userEvent.type(screen.getByPlaceholderText('Full Name'), 'Jane Admin');
        await userEvent.type(screen.getByPlaceholderText('Email address'), 'jane@example.com');
        await userEvent.type(screen.getByPlaceholderText('Strong Password'), 'StrongPass1!');
        await userEvent.click(screen.getByRole('button', { name: /get started/i }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                full_name: 'Jane Admin',
                email: 'jane@example.com',
                password: 'StrongPass1!'
            });
        });
    });

    it('shows development reset tokens after forgot password', async () => {
        mockForgotPassword.mockResolvedValueOnce({
            message: 'Reset issued',
            resetToken: 'dev-token-123'
        });
        renderWithRouter(<ForgotPassword />);

        await userEvent.type(screen.getByPlaceholderText('Email address'), 'user@example.com');
        await userEvent.click(screen.getByRole('button', { name: /request reset/i }));

        await waitFor(() => {
            expect(screen.getByText('Development Reset Token')).toBeInTheDocument();
            expect(screen.getByText('Continue to reset password')).toBeInTheDocument();
        });
    });

    it('submits password reset requests', async () => {
        mockResetPassword.mockResolvedValueOnce({ message: 'Password reset successfully' });
        renderWithRouter(<ResetPassword />, ['/reset-password?token=abc-token']);

        await userEvent.type(screen.getByPlaceholderText('New password'), 'NewStrong1!');
        await userEvent.click(screen.getByRole('button', { name: /update password/i }));

        await waitFor(() => {
            expect(mockResetPassword).toHaveBeenCalledWith({
                token: 'abc-token',
                password: 'NewStrong1!'
            });
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    it('renders the unauthorized page actions', () => {
        renderWithRouter(<Unauthorized />);
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Return to Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Return to Login')).toBeInTheDocument();
    });
});
