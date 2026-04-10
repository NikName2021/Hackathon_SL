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
export type TeamStatus = 'recruiting' | 'applied' | 'active' | 'completed';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface SmartBadge {
  type: 'category_top' | 'department_veteran' | 'speedster';
  label: string;
  description: string;
}

export interface TaskApplication {
  id: number;
  task_id: number;
  student_id: number;
  student: User;
  task: Task;
  message?: string;
  status: ApplicationStatus;
  created_at: string;
  team?: TaskTeam;
  smart_badges: SmartBadge[];
  is_best_match: boolean;
}

export interface TaskAttachment {
  id: number;
  filename: string;
  url: string;
  file_type?: 'image' | 'document';
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  acceptance_criteria?: string;
  performer_requirements?: string;
  category: Category;
  owner: User;
  assignee?: User;
  applications?: TaskApplication[];
  points_reward: number;
  status: TaskStatus;
  is_confidential?: boolean;
  created_at: string;
  deadline?: string;
  latest_submission?: Submission;
  rejection_reason?: string;
  skills: Skill[];
  attachments: TaskAttachment[];
  team?: TaskTeam;
}

export interface TeamMember {
  id: number;
  user_id: number;
  user: {
    id: number;
    full_name: string;
    role: Role;
    reputation: number;
  };
}

export interface TaskTeam {
  id: number;
  task_id: number;
  creator_id: number;
  name?: string;
  status: TeamStatus;
  created_at: string;
  creator: {
    id: number;
    full_name: string;
    role: Role;
    reputation: number;
  };
  members: TeamMember[];
}

export interface Submission {
  id: number;
  task_id: number;
  student_id: number;
  content: string;
  status?: string;
  feedback?: string;
  is_secure_file?: boolean;
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
  skill_distribution: Array<{ subject: string; A: number; fullMark: number }>;
}

export interface DailyActivity {
  date: string;
  tasks: number;
  users: number;
  points: number;
}

export interface AdminStats {
  total_users: number;
  total_tasks: number;
  pending_tasks: number;
  total_points_awarded: number;
  activity_log: DailyActivity[];
}

export interface DashboardStats {
  active_tasks: number;
  pending_reviews: number;
  completed_tasks: number;
  total_points: number;
  pending_applications: number;
  pending_moderation: number;
}

export interface RecommendedTask {
  id: number;
  title: string;
  description?: string;
  points_reward: number;
  category: string;
  owner_name: string;
  match_score: number;
  skills: string[];
  attachments: TaskAttachment[];
}

export interface FAQArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  target_role: Role | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  user_id: number;
  actor_id?: number;
  actor?: User;
  task_id?: number;
  task?: { id: number; title: string };
  activity_type: string;
  content?: string;
  created_at: string;
}
