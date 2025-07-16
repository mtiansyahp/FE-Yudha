import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Penilaian from '../pages/Penilaian';
import ManajemenUser from '../pages/ManajemenUser';
import About from '../pages/About';
import { Login } from '../pages/Login';
import AdminUnit from '../pages/AdminUnit';


export default function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected/main */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/penilaian" element={<Penilaian />} />
            <Route path="/manajemen-user" element={<ManajemenUser />} />
            <Route path="/admin-unit" element={<AdminUnit />} />
            <Route path="/about" element={<About />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
