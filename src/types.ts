export interface UserAccount {
  id: string;
  name: string;
  email: string;
  registrationDate: string;
  lastActiveWorkout: string;
  status: 'active' | 'inactive' | 'banned';
  workoutsCount: number;
  caloriesBudget: string;
  durationMins: number;
  subscription_tier?: 'free' | 'premium';
}

export interface MetricCard {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  history: number[];
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  targetGroup: string;
  sentAt: string;
}

export interface SystemSettings {
  allowSignups: boolean;
  dataSyncInterval: number; // in seconds
  activeFeatureTesting: boolean;
  maintenanceMode: boolean;
  serverRegion: string;
  apiLogLevel: 'info' | 'warn' | 'error' | 'debug';
}
