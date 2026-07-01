import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './ThemeContext';

// Layouts & Basic Components
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import LoadingState from './components/LoadingState';

// Lazy Loaded Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetails = lazy(() => import('./pages/CustomerDetails'));
const Orders = lazy(() => import('./pages/Orders'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Users = lazy(() => import('./pages/Users'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <SocketProvider>
                        <BrowserRouter>
                            <Suspense fallback={<LoadingState message="Launching Enterprise BI..." />}>
                                <Toaster 
                                    position="top-right"
                                    toastOptions={{
                                        duration: 4000,
                                        style: {
                                            background: 'hsl(var(--card))',
                                            color: 'hsl(var(--foreground))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                                        },
                                        success: {
                                            iconTheme: {
                                                primary: '#10b981',
                                                secondary: 'white',
                                            },
                                            style: {
                                                borderLeft: '4px solid #10b981',
                                            },
                                        },
                                        error: {
                                            iconTheme: {
                                                primary: '#ef4444',
                                                secondary: 'white',
                                            },
                                            style: {
                                                borderLeft: '4px solid #ef4444',
                                            },
                                        },
                                    }}
                                />
                                <Routes>
                                    {/* Public Routes */}
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/forgot-password" element={<ForgotPassword />} />
                                    <Route path="/reset-password" element={<ResetPassword />} />
                                    <Route path="/unauthorized" element={<Unauthorized />} />
                                    
                                    {/* Protected Routes - All Staff */}
                                    <Route element={<ProtectedRoute />}>
                                        <Route element={<DashboardLayout />}>
                                            <Route path="/" element={<Dashboard />} />
                                            <Route path="/inventory" element={<Inventory />} />
                                            <Route path="/orders" element={<Orders />} />
                                            <Route path="/notifications" element={<Notifications />} />
                                            <Route path="/settings" element={<Settings />} />
                                        </Route>
                                    </Route>

                                    {/* Admin Only Routes */}
                                    <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                                        <Route element={<DashboardLayout />}>
                                            <Route path="/reports" element={<Reports />} />
                                            <Route path="/customers" element={<Customers />} />
                                            <Route path="/customers/:id" element={<CustomerDetails />} />
                                            <Route path="/audit-logs" element={<AuditLogs />} />
                                            <Route path="/users" element={<Users />} />
                                        </Route>
                                    </Route>

                                    {/* Fallback */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </Suspense>
                        </BrowserRouter>
                    </SocketProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export default App;
