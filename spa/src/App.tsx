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
import { MyTasks } from '@/pages/MyTasks';
import { ApplicationsPanel } from '@/pages/ApplicationsPanel';
import { ModerationPanel } from '@/pages/ModerationPanel';

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

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route index element={<DashboardHub />} />
        <Route path="tasks" element={<TaskCatalog />} />
        <Route path="tasks/my" element={<MyTasks />} />
        <Route path="tasks/new" element={<CreateTask />} />
        <Route path="reviews" element={<EmployeeReviews />} />
        <Route path="applications" element={<ApplicationsPanel />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="moderation" element={<ModerationPanel />} />
      </Route>
    </Routes>
  );
}

export default App;
