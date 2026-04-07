export type Role = 'student' | 'employee' | 'admin';

export interface Skill {
  id: number;
  name: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_type: string;
  earned_at?: string;
}

export interface User {
  id: number;
  email: string;
  role: Role;
  full_name: string;
  points: number;
  reputation: number;
  is_active: boolean;
  bio?: string;
  avatar_url?: string;
  resume_path?: string;
  skills?: Skill[];
  achievements?: Achievement[];
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

export type TaskStatus = 'pending_approval' | 'open' | 'in_progress' | 'review' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface TaskApplication {
  id: number;
  task_id: number;
  student_id: number;
  message?: string;
  status: ApplicationStatus;
  applied_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  category: Category;
  owner: User;
  applications?: TaskApplication[];
  points_reward: number;
  status: TaskStatus;
  created_at: string;
  deadline?: string;
  latest_submission?: Submission;
}

export interface Submission {
  id: number;
  task_id: number;
  student_id: number;
  content: string;
  status?: string;
  feedback?: string;
  submitted_at: string;
}

export interface LeaderboardUser {
  id: number;
  full_name: string;
  reputation: number;
  points: number;
  avatar_url?: string;
  rank: number;
  skills: string[];
}

export interface GamificationStats {
  level: number;
  points_to_next_level: number;
  progress_percentage: number;
  total_points: number;
  rank: number;
  achievements: Achievement[];
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
