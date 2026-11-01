import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage';
import { CreateTicketPage } from '../pages/student/CreateTicketPage';
import { MyTicketsPage } from '../pages/student/MyTicketsPage';
import { TechnicianDashboardPage } from '../pages/technician/TechnicianDashboardPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminTicketsPage } from '../pages/admin/AdminTicketsPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { TicketDetailPage } from '../pages/tickets/TicketDetailPage';
import { NotFoundPage } from '../pages/errors/NotFoundPage';
import { UnauthorizedPage } from '../pages/errors/UnauthorizedPage';

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'TECHNICIAN':
      return <Navigate to="/technician/dashboard" replace />;
    case 'STUDENT':
    default:
      return <Navigate to="/student/dashboard" replace />;
  }
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Error pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected App routes inside AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<RootRedirect />} />

        {/* Common Ticket Details */}
        <Route element={<ProtectedRoute />}>
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Route>

        {/* Student routes */}
        <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']} />}>
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/create-ticket" element={<CreateTicketPage />} />
          <Route path="/student/my-tickets" element={<MyTicketsPage />} />
        </Route>

        {/* Technician routes */}
        <Route element={<ProtectedRoute allowedRoles={['TECHNICIAN', 'ADMIN']} />}>
          <Route path="/technician/dashboard" element={<TechnicianDashboardPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/tickets" element={<AdminTicketsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>

        {/* 404 handler inside layout */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

