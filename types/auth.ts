export type Gender = 'male' | 'female' | 'other';
export type GoalType = 'weight_loss' | 'muscle_gain' | 'maintenance' | 'health_improvement';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: Gender;
  age: number;
  height: number;
  weight: number;
  goal: GoalType;
  allergies: string[];
  medical_conditions: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
} 