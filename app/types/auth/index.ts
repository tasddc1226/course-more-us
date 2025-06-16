export interface LoginFormData {
  email: string;
  password: string;
  redirectTo?: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface UserAgreement {
  id: string;
  user_id: string;
  agreement_type: string;
  agreed: boolean;
  agreed_at: string | null;
  created_at: string;
  updated_at: string;
} 