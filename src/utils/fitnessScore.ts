import { WorkoutEntry } from './storage';

export interface FitnessScore {
  total: number;          // 0–100 overall score
  consistency: number;    // 0–100 — workout days / days elapsed
  effort: number;         // 0–100 — avg feeling rating
  volume: number;         // 0–100 — avg session duration vs 45-min baseline
  level: string;          // Beginner / Building / Active / Athlete / Elite
  levelColor: string;
  totalMinutes: number;
  avgDuration: number;
  avgFeeling: number;
  streak: number;         // current consecutive workout days
}

const LEVEL_THRESHOLDS = [
  { min: 80, label: 'Elite',    color: '#39FF14', minDays: 21 },
  { min: 60, label: 'Athlete',  color: '#00E5CC', minDays: 10 },
  { min: 40, label: 'Active',   color: '#00BFFF', minDays: 4  },
  { min: 20, label: 'Building', color: '#8B5CF6', minDays: 1  },
  { min: 0,  label: 'Beginner', color: '#6B7280', minDays: 0  },
];

export function computeFitnessScore(
  workouts: WorkoutEntry[],
  startDate: string,
  dayNumber: number,
): FitnessScore {
  if (workouts.length === 0 || dayNumber < 1) {
    return {
      total: 0, consistency: 0, effort: 0, volume: 0,
      level: 'Beginner', levelColor: '#6B7280',
      totalMinutes: 0, avgDuration: 0, avgFeeling: 0, streak: 0,
    };
  }

  const daysElapsed = Math.max(dayNumber - 1, 1);

  // Consistency — unique calendar days with a workout
  const uniqueDays = new Set(workouts.map(w => w.date)).size;
  const consistency = Math.min(uniqueDays / daysElapsed, 1.0);

  // Effort — avg feeling (1–5) normalised to 0–1
  const avgFeeling = workouts.reduce((s, w) => s + w.feeling, 0) / workouts.length;
  const effort = (avgFeeling - 1) / 4;

  // Volume — avg session vs 45-min "full workout" baseline
  const totalMinutes = workouts.reduce((s, w) => s + w.duration, 0);
  const avgDuration = totalMinutes / workouts.length;
  const volume = Math.min(avgDuration / 45, 1.0);

  // Weighted composite
  const raw = consistency * 0.40 + effort * 0.35 + volume * 0.25;
  const total = Math.round(raw * 100);

  const { label, color } = LEVEL_THRESHOLDS.find(t => total >= t.min && uniqueDays >= t.minDays)!;

  // Streak — consecutive calendar days (most recent first)
  const streak = computeStreak(workouts, startDate, dayNumber);

  return {
    total,
    consistency: Math.round(consistency * 100),
    effort: Math.round(effort * 100),
    volume: Math.round(volume * 100),
    level: label,
    levelColor: color,
    totalMinutes,
    avgDuration: Math.round(avgDuration),
    avgFeeling: Math.round(avgFeeling * 10) / 10,
    streak,
  };
}

function computeStreak(workouts: WorkoutEntry[], _startDate: string, currentDay: number): number {
  const workedDays = new Set(workouts.map(w => w.dayNumber));
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (workedDays.has(d)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export const WORKOUT_TYPES = [
  { label: 'Run',  icon: '🏃' },
  { label: 'Ride', icon: '🚴' },
  { label: 'Walk', icon: '🚶' },
  { label: 'Swim', icon: '🏊' },
  { label: 'Gym',  icon: '🏋️' },
  { label: 'Yoga', icon: '🧘' },
  { label: 'Other',icon: '⚡' },
];

export const FEELING_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: 'Rough',   emoji: '😓', color: '#EF4444' },
  2: { label: 'Tired',   emoji: '😤', color: '#F97316' },
  3: { label: 'OK',      emoji: '😐', color: '#EAB308' },
  4: { label: 'Good',    emoji: '😊', color: '#22C55E' },
  5: { label: 'Great!',  emoji: '💪', color: '#00E5CC' },
};
