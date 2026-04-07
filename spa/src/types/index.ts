export type Role = 'student' | 'employee' | 'admin';

export interface User {
  id: number;
  email: string;
  role: Role;
  full_name: string | null;
  points: number;
  reputation: number;
  is_active?: boolean;
  created_date?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  token: Token;
  status: string;
}

export type TaskStatus =
  | 'pending_approval'
  | 'open'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Category {
  id: number;
  name: string;
}

export interface Submission {
  id: number;
  task_id: number;
  student_id: number;
  content: string;
  status: string;
  feedback?: string | null;
  submitted_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  category?: Category | null;
  owner: User;
  points_reward: number;
  status: TaskStatus;
  created_date: string;
  deadline?: string | null;
  latest_submission?: Submission | null;
}

export interface Application {
  id: number;
  task_id: number;
  task: Task;
  student: User;
  message?: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_tasks: number;
  pending_tasks: number;
  total_points_awarded: number;
}

export interface DashboardStats {
  active_tasks: number;
  pending_reviews: number;
  completed_tasks: number;
  total_points: number;
  pending_applications: number;
  pending_moderation: number;
}
