import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  START_DATE: '@42_start_date',
  COMPLETED_DAYS: '@42_completed_days',
  PROGRAM_STARTED: '@42_program_started',
  WORKOUTS: '@42_workouts',
  REST_DAYS: '@42_rest_days',
};

export interface AppData {
  startDate: string | null;
  completedDays: number[];
  programStarted: boolean;
}

export interface WorkoutEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  dayNumber: number;
  type: string;       // 'Run' | 'Ride' | 'Walk' | 'Swim' | 'Gym' | 'Yoga' | 'Other'
  duration: number;   // minutes
  feeling: number;    // 1–5
  notes: string;
  photoUri?: string;
  heartRateAvg?: number;
  calories?: number;
  distanceMi?: number;
}

export async function loadData(): Promise<AppData> {
  const [startDate, completedDaysRaw, programStarted] = await Promise.all([
    AsyncStorage.getItem(KEYS.START_DATE),
    AsyncStorage.getItem(KEYS.COMPLETED_DAYS),
    AsyncStorage.getItem(KEYS.PROGRAM_STARTED),
  ]);
  return {
    startDate,
    completedDays: completedDaysRaw ? JSON.parse(completedDaysRaw) : [],
    programStarted: programStarted === 'true',
  };
}

export async function saveStartDate(date: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.START_DATE, date);
}

export async function saveProgramStarted(started: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROGRAM_STARTED, String(started));
}

export async function toggleDayComplete(day: number, completedDays: number[]): Promise<number[]> {
  const updated = completedDays.includes(day)
    ? completedDays.filter(d => d !== day)
    : [...completedDays, day];
  await AsyncStorage.setItem(KEYS.COMPLETED_DAYS, JSON.stringify(updated));
  return updated;
}

export async function resetAll(): Promise<void> {
  await Promise.all(Object.values(KEYS).map(k => AsyncStorage.removeItem(k)));
}

// ── Rest days ──────────────────────────────────────────────────────────────────

export async function loadRestDays(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.REST_DAYS);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleRestDay(date: string): Promise<string[]> {
  const existing = await loadRestDays();
  const updated = existing.includes(date)
    ? existing.filter(d => d !== date)
    : [...existing, date];
  await AsyncStorage.setItem(KEYS.REST_DAYS, JSON.stringify(updated));
  return updated;
}

// ── Workout CRUD ──────────────────────────────────────────────────────────────

export async function loadWorkouts(): Promise<WorkoutEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.WORKOUTS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveWorkout(entry: WorkoutEntry): Promise<WorkoutEntry[]> {
  const existing = await loadWorkouts();
  const updated = [entry, ...existing];
  await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(updated));
  // Auto-mark the day as complete
  const dayRaw = await AsyncStorage.getItem(KEYS.COMPLETED_DAYS);
  const days: number[] = dayRaw ? JSON.parse(dayRaw) : [];
  if (!days.includes(entry.dayNumber)) {
    await AsyncStorage.setItem(KEYS.COMPLETED_DAYS, JSON.stringify([...days, entry.dayNumber]));
  }
  return updated;
}

export async function updateWorkout(entry: WorkoutEntry): Promise<WorkoutEntry[]> {
  const existing = await loadWorkouts();
  const updated = existing.map(w => w.id === entry.id ? entry : w);
  await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(updated));
  return updated;
}

export async function deleteWorkout(id: string): Promise<WorkoutEntry[]> {
  const existing = await loadWorkouts();
  const updated = existing.filter(w => w.id !== id);
  await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(updated));
  return updated;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDayNumber(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff + 1, 1);
}

export function getDaysRemaining(startDate: string): number {
  return Math.max(42 - getDayNumber(startDate) + 1, 0);
}

export function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
