import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
    const { user } = useAuth();
    if (!user) {
        // belum login → redirect ke /login
        return <Navigate to="/login" replace />;
    }
    // sudah login → render children routes
    return <Outlet />;
}
