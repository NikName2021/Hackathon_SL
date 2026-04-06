import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { StudentDashboard } from './StudentDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { AdminDashboard } from './AdminDashboard';

export const DashboardHub: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <div>Role not recognized</div>;
  }
};
