import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth()
}));

const renderWithRoutes = (element) => render(
    <MemoryRouter initialEntries={['/secure']}>
        <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
            <Route element={element}>
                <Route path="/secure" element={<div>Secure Content</div>} />
            </Route>
        </Routes>
    </MemoryRouter>
);

describe('ProtectedRoute', () => {
    beforeEach(() => {
        mockUseAuth.mockReset();
    });

    it('shows a loading state while auth is loading', () => {
        mockUseAuth.mockReturnValue({ user: null, loading: true });
        renderWithRoutes(<ProtectedRoute />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('redirects guests to login', () => {
        mockUseAuth.mockReturnValue({ user: null, loading: false });
        renderWithRoutes(<ProtectedRoute />);
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('redirects unauthorized users to the unauthorized page', () => {
        mockUseAuth.mockReturnValue({ user: { role: 'User' }, loading: false });
        renderWithRoutes(<ProtectedRoute allowedRoles={['Admin']} />);
        expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    });

    it('renders the protected outlet for allowed users', () => {
        mockUseAuth.mockReturnValue({ user: { role: 'Admin' }, loading: false });
        renderWithRoutes(<ProtectedRoute allowedRoles={['Admin']} />);
        expect(screen.getByText('Secure Content')).toBeInTheDocument();
    });
});
