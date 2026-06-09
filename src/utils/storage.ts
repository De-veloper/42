import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  START_DATE: '@42_start_date',
  COMPLETED_DAYS: '@42_completed_days',
  PROGRAM_STARTED: '@42_program_started',
  WORKOUTS: '@42_workouts',
  REST_DAYS: '@42_rest_days',
  DEMO_DATE: '@42_demo_date',
};

export interface AppData {
  startDate: string | null;
  completedDays: number[];
  programStarted: boolean;
}

export interface WorkoutEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  timestamp?: string; // ISO 8601 full datetime, e.g. "2026-06-08T14:30:00.000Z"
  dayNumber: number;
  type: string;       // 'Run' | 'Ride' | 'Walk' | 'Swim' | 'Gym' | 'Yoga' | 'Other'
  duration: number;   // minutes
  feeling: number;    // 1–5
  notes: string;
  photoUri?: string;
  heartRateAvg?: number;
  calories?: number;
  distanceKm?: number;
}

// ── Simulated date (demo mode) ────────────────────────────────────────────────
// Cached in memory so it can be read synchronously after loadDemoDate() is called at startup.

let _simulatedToday: Date | null = null;

export async function loadDemoDate(): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.DEMO_DATE);
  _simulatedToday = raw ? new Date(raw + 'T00:00:00') : null;
}

export async function setDemoDate(dateStr: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.DEMO_DATE, dateStr);
  _simulatedToday = new Date(dateStr + 'T00:00:00');
}

export async function clearDemoDate(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.DEMO_DATE);
  _simulatedToday = null;
}

/** Returns the simulated date in demo mode, otherwise real today. */
export function getToday(): Date {
  return _simulatedToday ? new Date(_simulatedToday) : new Date();
}

// ── App data ──────────────────────────────────────────────────────────────────

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
  _simulatedToday = null;
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
  const workouts: WorkoutEntry[] = raw ? JSON.parse(raw) : [];
  const seen = new Set<string>();
  return workouts.filter(w => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });
}

export async function saveWorkout(entry: WorkoutEntry): Promise<WorkoutEntry[]> {
  const existing = await loadWorkouts();
  const updated = [entry, ...existing.filter(w => w.id !== entry.id)];
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
  const d = getToday();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDayNumber(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const today = getToday();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diff + 1, 1), 42);
}

export function getDaysRemaining(startDate: string): number {
  return Math.max(42 - getDayNumber(startDate) + 1, 0);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
