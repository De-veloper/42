import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_TASK = '42-workout-location';
const RUN_KEY = '@42_current_gps_run';

export type LocationPoint = { lat: number; lon: number; t: number };

export type GpsSnapshot = {
  startTime: number;
  pausedMs: number;
  pauseStartTime: number | null;
  locations: LocationPoint[];
  active: boolean;
};

// Must be at module top-level so it's registered before the task fires
TaskManager.defineTask(LOCATION_TASK, ({ data, error }: any) => {
  if (error || !data) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  AsyncStorage.getItem(RUN_KEY).then(raw => {
    const snap: GpsSnapshot = raw
      ? JSON.parse(raw)
      : { startTime: Date.now(), pausedMs: 0, pauseStartTime: null, locations: [], active: true };
    const filtered = locations
      .filter(l => (l.coords.accuracy ?? 999) < 40)
      .map(l => ({ lat: l.coords.latitude, lon: l.coords.longitude, t: l.timestamp }));
    snap.locations = [...snap.locations, ...filtered];
    AsyncStorage.setItem(RUN_KEY, JSON.stringify(snap));
  });
});

// ── Geo math ──────────────────────────────────────────────────────────────────

export function haversineMi(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeDistanceMi(pts: LocationPoint[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const step = haversineMi(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
    if (step < 0.1) d += step; // ignore GPS noise jumps (0.1 mi ≈ 160m)
  }
  return d;
}

export function formatElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// ── Permissions ───────────────────────────────────────────────────────────────

export async function requestLocationPermissions(): Promise<{ granted: boolean; backgroundGranted: boolean }> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return { granted: false, backgroundGranted: false };
  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  return { granted: true, backgroundGranted: bg === 'granted' };
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

export async function startGpsTracking(backgroundGranted: boolean): Promise<void> {
  const snap: GpsSnapshot = {
    startTime: Date.now(),
    pausedMs: 0,
    pauseStartTime: null,
    locations: [],
    active: true,
  };
  await AsyncStorage.setItem(RUN_KEY, JSON.stringify(snap));
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 2000,
    distanceInterval: 3,
    showsBackgroundLocationIndicator: backgroundGranted,
    foregroundService: {
      notificationTitle: '42 — Tracking workout',
      notificationBody: 'GPS is recording your distance.',
      notificationColor: '#00E5CC',
    },
  });
}

export async function stopGpsTracking(): Promise<GpsSnapshot | null> {
  const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  const raw = await AsyncStorage.getItem(RUN_KEY);
  if (!raw) return null;
  const snap: GpsSnapshot = JSON.parse(raw);
  snap.active = false;
  if (snap.pauseStartTime) {
    snap.pausedMs += Date.now() - snap.pauseStartTime;
    snap.pauseStartTime = null;
  }
  await AsyncStorage.setItem(RUN_KEY, JSON.stringify(snap));
  return snap;
}

export async function getGpsSnapshot(): Promise<GpsSnapshot | null> {
  const raw = await AsyncStorage.getItem(RUN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearGpsRun(): Promise<void> {
  const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
  await AsyncStorage.removeItem(RUN_KEY);
}

export function computeElapsedMs(snap: GpsSnapshot): number {
  const base = Date.now() - snap.startTime - snap.pausedMs;
  if (snap.pauseStartTime) return base - (Date.now() - snap.pauseStartTime);
  return base;
}
