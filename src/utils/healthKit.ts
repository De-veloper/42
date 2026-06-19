import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadData, getDayNumber, saveWorkout, loadWorkouts, WorkoutEntry } from './storage';

const AppleHealthKit = NativeModules.AppleHealthKit as any;

const PERMISSIONS = {
  permissions: {
    read:  ['HeartRate', 'ActiveEnergyBurned', 'StepCount', 'Workout'],
    write: ['ActiveEnergyBurned', 'Workout'],
  },
};

const ACTIVITIES: Record<string, string> = {
  Run:   'Running',
  Ride:  'Cycling',
  Walk:  'Walking',
  Swim:  'Swimming',
  Gym:   'TraditionalStrengthTraining',
  Yoga:  'Yoga',
  Other: 'MixedCardio',
};

const ACTIVITY_TO_TYPE: Record<string, string> = {
  Running:                     'Run',
  Cycling:                     'Ride',
  Walking:                     'Walk',
  Swimming:                    'Swim',
  TraditionalStrengthTraining: 'Gym',
  Yoga:                        'Yoga',
  MixedCardio:                 'Other',
};

const HK_IMPORTED_KEY = '@42_hk_imported_uuids';
const HK_LAST_SYNC_KEY = '@42_hk_last_sync';

let _initialized = false;

export function isHealthKitAvailable() {
  return Platform.OS === 'ios' && !!AppleHealthKit;
}

export function isReady() {
  return isHealthKitAvailable() && _initialized;
}

export function initHealthKit(): Promise<boolean> {
  if (!isHealthKitAvailable()) return Promise.resolve(false);
  return new Promise(resolve => {
    try {
      AppleHealthKit.initHealthKit(PERMISSIONS, (err: string) => {
        _initialized = !err;
        if (err) console.warn('[HealthKit] init:', err);
        resolve(_initialized);
      });
    } catch (e) {
      console.warn('[HealthKit] init error:', e);
      resolve(false);
    }
  });
}

export function saveWorkoutToHealth(options: {
  type: string;
  durationMins: number;
  calories?: number;
  startDate: Date;
}): Promise<void> {
  if (!isReady()) return Promise.resolve();
  const endDate = new Date(options.startDate.getTime() + options.durationMins * 60 * 1000);
  const activity = ACTIVITIES[options.type] ?? 'MixedCardio';
  return new Promise(resolve => {
    try {
      AppleHealthKit.saveWorkout(
        {
          type: activity,
          startDate: options.startDate.toISOString(),
          endDate: endDate.toISOString(),
          duration: options.durationMins * 60,
          ...(options.calories ? { energyBurned: options.calories, energyBurnedUnit: 'calorie' } : {}),
        },
        (err: string) => {
          if (err) console.warn('[HealthKit] saveWorkout:', err);
          resolve();
        }
      );
    } catch (e) {
      console.warn('[HealthKit] saveWorkout threw:', e);
      resolve();
    }
  });
}

export interface HKWorkoutData {
  heartRateAvg: number | null;
  calories: number | null;
}

export function fetchWorkoutData(durationMins: number): Promise<HKWorkoutData> {
  if (!isReady()) return Promise.resolve({ heartRateAvg: null, calories: null });
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - durationMins * 60 * 1000).toISOString();

  const hrPromise = new Promise<number | null>(resolve => {
    try {
      AppleHealthKit.getHeartRateSamples(
        { startDate, endDate, ascending: false },
        (err: string, results: { value: number }[]) => {
          if (err || !results?.length) return resolve(null);
          resolve(Math.round(results.reduce((s, r) => s + r.value, 0) / results.length));
        }
      );
    } catch { resolve(null); }
  });

  const calPromise = new Promise<number | null>(resolve => {
    try {
      AppleHealthKit.getActiveEnergyBurned(
        { startDate, endDate },
        (err: string, results: { value: number }[]) => {
          if (err || !results?.length) return resolve(null);
          resolve(Math.round(results.reduce((s, r) => s + r.value, 0)));
        }
      );
    } catch { resolve(null); }
  });

  return Promise.all([hrPromise, calPromise]).then(([heartRateAvg, calories]) => ({
    heartRateAvg,
    calories,
  }));
}

// ── Daily steps ──────────────────────────────────────────────────────────────

export function fetchDailySteps(dateStr: string): Promise<number> {
  if (!isReady()) return Promise.resolve(0);
  return new Promise(resolve => {
    try {
      AppleHealthKit.getDailySteps(
        { date: dateStr },
        (err: string, steps: number) => {
          if (err) return resolve(0);
          resolve(steps ?? 0);
        }
      );
    } catch { resolve(0); }
  });
}

// ── Auto-import from HealthKit ───────────────────────────────────────────────

interface HKWorkoutRecord {
  uuid: string;
  activityType: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  calories?: number;
  distanceMi?: number;
}

function fetchRecentWorkouts(sinceISO: string): Promise<HKWorkoutRecord[]> {
  if (!isReady()) return Promise.resolve([]);
  return new Promise(resolve => {
    try {
      AppleHealthKit.getRecentWorkouts(
        { startDate: sinceISO },
        (err: string, results: HKWorkoutRecord[]) => {
          if (err || !results) return resolve([]);
          resolve(results);
        }
      );
    } catch { resolve([]); }
  });
}

export interface SyncResult {
  imported: number;
  found: number;
  skippedAlreadyImported: number;
  skippedShort: number;
  skippedDuplicate: number;
}

export async function autoImportFromHealth(): Promise<SyncResult> {
  const empty: SyncResult = { imported: 0, found: 0, skippedAlreadyImported: 0, skippedShort: 0, skippedDuplicate: 0 };
  if (!isReady()) return empty;

  const { startDate, programStarted } = await loadData();
  if (!programStarted || !startDate) return empty;

  // Fix dayNumbers on previously imported workouts
  const allWorkouts = await loadWorkouts();
  const programStart = new Date(startDate + 'T00:00:00');
  programStart.setHours(0, 0, 0, 0);
  let needsSave = false;
  for (const w of allWorkouts) {
    if (w.id.startsWith('hk-') && w.date) {
      const wDate = new Date(w.date + 'T00:00:00');
      wDate.setHours(0, 0, 0, 0);
      const correctDay = Math.max(Math.floor((wDate.getTime() - programStart.getTime()) / 86400000) + 1, 1);
      if (w.dayNumber !== correctDay) {
        w.dayNumber = correctDay;
        needsSave = true;
      }
    }
  }
  if (needsSave) {
    await AsyncStorage.setItem('@42_workouts', JSON.stringify(allWorkouts));
  }

  // Always look back from program start to catch all workouts
  const sinceISO = new Date(startDate + 'T00:00:00').toISOString();

  const hkWorkouts = await fetchRecentWorkouts(sinceISO);
  const result: SyncResult = { ...empty, found: hkWorkouts.length };
  if (!hkWorkouts.length) return result;

  const importedRaw = await AsyncStorage.getItem(HK_IMPORTED_KEY);
  const importedSet = new Set<string>(importedRaw ? JSON.parse(importedRaw) : []);

  const existingWorkouts = await loadWorkouts();
  const existingTimestamps = new Set(existingWorkouts.map(w => w.timestamp).filter(Boolean));

  for (const hw of hkWorkouts) {
    if (importedSet.has(hw.uuid)) { result.skippedAlreadyImported++; continue; }
    if (hw.durationMinutes < 1) { result.skippedShort++; continue; }
    if (existingTimestamps.has(hw.startDate)) { result.skippedDuplicate++; continue; }

    const workoutDate = new Date(hw.startDate);
    const dateStr = `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}-${String(workoutDate.getDate()).padStart(2, '0')}`;
    const programStart = new Date(startDate + 'T00:00:00');
    programStart.setHours(0, 0, 0, 0);
    const wDate = new Date(workoutDate);
    wDate.setHours(0, 0, 0, 0);
    const dayNumber = Math.max(Math.floor((wDate.getTime() - programStart.getTime()) / 86400000) + 1, 1);

    const entry: WorkoutEntry = {
      id: `hk-${hw.uuid}`,
      date: dateStr,
      timestamp: hw.startDate,
      dayNumber,
      type: ACTIVITY_TO_TYPE[hw.activityType] ?? 'Other',
      duration: hw.durationMinutes,
      feeling: 3,
      notes: '',
      ...(hw.calories ? { calories: hw.calories } : {}),
      ...(hw.distanceMi ? { distanceMi: hw.distanceMi } : {}),
    };

    await saveWorkout(entry);
    importedSet.add(hw.uuid);
    result.imported++;
  }

  await AsyncStorage.setItem(HK_IMPORTED_KEY, JSON.stringify([...importedSet]));
  return result;
}
