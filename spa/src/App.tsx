import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardHub } from '@/pages/DashboardHub';
import { TaskCatalog } from '@/pages/TaskCatalog';
import { CreateTask } from '@/pages/CreateTask';
import { EmployeeReviews } from '@/pages/EmployeeReviews';
import { AdminPanel } from '@/pages/AdminPanel';
import { AdminUsers } from '@/pages/AdminUsers';
import { MyTasks } from '@/pages/MyTasks';
import { ApplicationsPanel } from '@/pages/ApplicationsPanel';
import { ModerationPanel } from '@/pages/ModerationPanel';
import { EditTask } from '@/pages/EditTask';
import { Profile } from '@/pages/Profile';
import Leaderboard from '@/pages/Leaderboard';
import { FAQ } from '@/pages/FAQ';
import { VerifyEmail } from '@/pages/VerifyEmail';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

import { NotificationProvider } from '@/context/NotificationContext';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 to-primary-50 dark:from-surface-900 dark:to-primary-900">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route index element={<DashboardHub />} />
          <Route path="tasks" element={<TaskCatalog />} />
          <Route path="tasks/my" element={<MyTasks />} />
          <Route path="tasks/new" element={<CreateTask />} />
          <Route path="tasks/edit/:id" element={<EditTask />} />
          <Route path="reviews" element={<EmployeeReviews />} />
          <Route path="applications" element={<ApplicationsPanel />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="moderation" element={<ModerationPanel />} />
          <Route path="profile" element={<Profile />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="faq" element={<FAQ />} />
        </Route>
      </Routes>
    </NotificationProvider>
  );
}

export default App;
