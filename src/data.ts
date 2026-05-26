import { UserAccount, MetricCard, SystemNotification, SystemSettings } from './types';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u-1',
    name: 'Marcus Vance',
    email: 'marcus.vance@perf-tech.io',
    registrationDate: '2026-01-12',
    lastActiveWorkout: 'High-Intensity Treadmill Interval (5.4km)',
    status: 'active',
    workoutsCount: 42,
    caloriesBudget: '2,600 kcal',
    durationMins: 45,
  },
  {
    id: 'u-2',
    name: 'Elena Rostova',
    email: 'elena.r@kinetic-fit.cc',
    registrationDate: '2026-02-19',
    lastActiveWorkout: 'Deadlift Velocity Peak Session',
    status: 'active',
    workoutsCount: 29,
    caloriesBudget: '2,100 kcal',
    durationMins: 60,
  },
  {
    id: 'u-3',
    name: 'Devon Takahashi',
    email: 'd.takahashi@tokyo-flux.jp',
    registrationDate: '2026-03-02',
    lastActiveWorkout: 'AMRAP Barbell Conditioning',
    status: 'active',
    workoutsCount: 56,
    caloriesBudget: '3,100 kcal',
    durationMins: 50,
  },
  {
    id: 'u-4',
    name: 'Chloe Lin',
    email: 'chloelin@macroflux-zone.com',
    registrationDate: '2026-03-24',
    lastActiveWorkout: 'Zone 2 Aerobic Heart Rate Sync',
    status: 'inactive',
    workoutsCount: 18,
    caloriesBudget: '1,800 kcal',
    durationMins: 75,
  },
  {
    id: 'u-5',
    name: 'Viktor Thorne',
    email: 'vthorne@abscutter.org',
    registrationDate: '2026-04-05',
    lastActiveWorkout: 'Heavy Squat Threshold Volumizer',
    status: 'active',
    workoutsCount: 33,
    caloriesBudget: '2,800 kcal',
    durationMins: 55,
  },
  {
    id: 'u-6',
    name: 'Sonia Patel',
    email: 'spatel@apex-fuel.net',
    registrationDate: '2026-04-11',
    lastActiveWorkout: 'Recovery Yoga & HRV Alignment',
    status: 'banned',
    workoutsCount: 5,
    caloriesBudget: '1,950 kcal',
    durationMins: 30,
  },
  {
    id: 'u-7',
    name: 'Aris Sterling',
    email: 'sterling.fit@fusion.io',
    registrationDate: '2026-05-18',
    lastActiveWorkout: 'Kettlebell Complex Kinetic Ladder',
    status: 'active',
    workoutsCount: 12,
    caloriesBudget: '2,400 kcal',
    durationMins: 40,
  }
];

export const INITIAL_METRICS: MetricCard[] = [
  {
    label: 'Total Athletes',
    value: '14,842',
    change: '+12.4%',
    isPositive: true,
    history: [11200, 11800, 12400, 13100, 13700, 14200, 14842],
  },
  {
    label: 'Monthly Rec. Revenue',
    value: '$42,912',
    change: '+8.7%',
    isPositive: true,
    history: [32000, 35000, 36500, 38200, 39900, 41200, 42912],
  },
  {
    label: 'Daily Workouts Logged',
    value: '2.4K',
    change: '+16.2%',
    isPositive: true,
    history: [1600, 1800, 1750, 1950, 2100, 2250, 2400],
  },
  {
    label: 'Active Biometric Pipelines',
    value: '8,924',
    change: '+22.1%',
    isPositive: true,
    history: [4500, 5200, 5900, 6800, 7400, 8100, 8924],
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Precision Macro Engine Update v2.4.1',
    message: 'Upgraded calculation models for thermic effect of high-protein feeding schedules.',
    targetGroup: 'All Premium Users',
    sentAt: '2026-05-25 14:32',
  },
  {
    id: 'notif-2',
    title: 'Peloton / Garmin Biometrics Sync Restored',
    message: 'Resolved high-frequency heartbeat ingest failures on older fenix series firmware.',
    targetGroup: 'Garmin Connected Athletes',
    sentAt: '2026-05-24 09:12',
  }
];

export const DEFAULT_SETTINGS: SystemSettings = {
  allowSignups: true,
  dataSyncInterval: 15,
  activeFeatureTesting: false,
  maintenanceMode: false,
  serverRegion: 'us-east1-gcp',
  apiLogLevel: 'info',
};
