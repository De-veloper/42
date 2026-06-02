import { NativeModules, Platform } from 'react-native';

const AppleHealthKit = NativeModules.AppleHealthKit as any;

const PERMISSIONS = {
  permissions: {
    read:  ['HeartRate', 'ActiveEnergyBurned', 'Workout'],
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
