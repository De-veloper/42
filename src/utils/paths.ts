import AsyncStorage from '@react-native-async-storage/async-storage';

const PATH_KEY = '@42_active_path';

export interface WeekPlan {
  week: number;
  sessions: number;
  minDuration: number;
  targetMi?: number;
  description: string;
}

export interface PathMilestone {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export interface GoalOption {
  id: string;
  label: string;
  targetMi: number;
  extraWeeks: number; // added weeks beyond base plan
  requiresGoalId?: string; // must complete this goal first to unlock
}

export interface PathDefinition {
  id: string;
  icon: string;
  title: string;
  goal: string;
  goalOptions?: GoalOption[]; // optional distance choices
  goalDetail: string;
  weeks: number;
  color: string;
  workoutType: string;
  weeklyPlan: WeekPlan[];
  milestones: PathMilestone[];
}

export interface ActivePath {
  pathId: string;
  startDate: string;
  customSessionsPerWeek?: number;
  selectedGoalId?: string;
  customTargetMi?: number; // used when selectedGoalId === 'custom'
  sessions: Array<{
    date: string;
    duration: number;
    distanceMi?: number;
  }>;
}

export const ALL_PATHS: PathDefinition[] = [
  {
    id: 'run_5k',
    icon: '🏃',
    title: 'Running Goal',
    goal: 'Pick your distance',
    goalDetail: 'Choose your running goal and build up to it week by week.',
    weeks: 8,
    color: '#00BFFF',
    workoutType: 'Run',
    goalOptions: [
      { id: '5k',     label: '5K',            targetMi: 3.1,  extraWeeks: 0 },
      { id: '10k',    label: '10K',           targetMi: 6.2,  extraWeeks: 4,  requiresGoalId: 'run_5k:5k' },
      { id: 'hm',     label: 'Half Marathon', targetMi: 13.1, extraWeeks: 8,  requiresGoalId: 'run_5k:10k' },
      { id: 'custom', label: 'Custom',        targetMi: 0,    extraWeeks: 0  },
    ],
    weeklyPlan: [
      { week: 1, sessions: 3, minDuration: 15, description: 'Easy 15-min runs, build the habit' },
      { week: 2, sessions: 3, minDuration: 20, description: 'Extend to 20 mins, keep it comfortable' },
      { week: 3, sessions: 3, minDuration: 25, description: '25-min runs, find your pace' },
      { week: 4, sessions: 3, minDuration: 25, targetMi: 2.0, description: 'Push for 2 miles on your long run' },
      { week: 5, sessions: 3, minDuration: 30, targetMi: 2.5, description: '2.5 miles — you\'re more than halfway!' },
      { week: 6, sessions: 3, minDuration: 30, targetMi: 2.8, description: 'Nearly there — 2.8 miles on your long run' },
      { week: 7, sessions: 3, minDuration: 35, targetMi: 3.0, description: 'Hit 3 miles this week — peak training' },
      { week: 8, sessions: 2, minDuration: 20, targetMi: 3.1, description: 'Taper + run your 5K. You\'re ready!' },
    ],
    milestones: [
      { id: 'first_run',   emoji: '👟', title: 'First Steps',   description: 'Log your first run session' },
      { id: 'one_mile',    emoji: '📍', title: 'One Mile',       description: 'Run 1 mile in a session' },
      { id: 'week1_run',   emoji: '🗓️', title: 'Week 1 Done',    description: 'Complete all Week 1 sessions' },
      { id: 'halfway_5k',  emoji: '🌗', title: 'Halfway There',  description: 'Complete 4 weeks of training' },
      { id: 'three_miles', emoji: '⚡', title: 'Three Miles',    description: 'Run 3 miles in a session' },
      { id: 'goal_5k',     emoji: '🏆', title: '5K Complete!',   description: 'Run 3.1 miles — you did it!' },
    ],
  },
  {
    id: 'ride_50k',
    icon: '🚴',
    title: 'Riding Goal',
    goal: 'Pick your distance',
    goalDetail: 'Choose your ride goal and build distance week by week.',
    weeks: 6,
    color: '#00E5CC',
    workoutType: 'Ride',
    goalOptions: [
      { id: '25mi',  label: '25 mi',       targetMi: 25,  extraWeeks: 0  },
      { id: '50mi',  label: '50 mi',       targetMi: 50,  extraWeeks: 4,  requiresGoalId: 'ride_50k:25mi' },
      { id: '100mi', label: 'Century',     targetMi: 100, extraWeeks: 10, requiresGoalId: 'ride_50k:50mi' },
      { id: 'custom', label: 'Custom',     targetMi: 0,   extraWeeks: 0  },
    ],
    weeklyPlan: [
      { week: 1, sessions: 2, minDuration: 30, targetMi: 5, description: '2 rides, build your base endurance' },
      { week: 2, sessions: 2, minDuration: 45, targetMi: 8, description: 'Longer rides, focus on cadence' },
      { week: 3, sessions: 3, minDuration: 45, targetMi: 12, description: 'Add a third ride, push distance' },
      { week: 4, sessions: 3, minDuration: 60, targetMi: 18, description: 'One long ride of 18 miles' },
      { week: 5, sessions: 3, minDuration: 60, targetMi: 25, description: 'Peak week — 25 mile long ride' },
      { week: 6, sessions: 2, minDuration: 30, targetMi: 28, description: 'Easy recovery rides + goal ¼ Ironman!' },
    ],
    milestones: [
      { id: 'first_ride',  emoji: '🚴', title: 'First Ride',    description: 'Log your first ride session' },
      { id: 'ten_miles',   emoji: '📍', title: 'Ten Miles',      description: 'Ride 10 miles in a session' },
      { id: 'week1_ride',  emoji: '🗓️', title: 'Week 1 Done',   description: 'Complete all Week 1 sessions' },
      { id: 'halfway_50k', emoji: '🌗', title: 'Halfway',        description: 'Complete 3 weeks of training' },
      { id: 'twenty_five', emoji: '⚡', title: '25 Miles',       description: 'Ride 25 miles in a session' },
      { id: 'goal_50k',    emoji: '🏆', title: '50km Complete!', description: 'Ride 31 miles — you did it!' },
    ],
  },
  {
    id: 'swim_1k',
    icon: '🏊',
    title: 'Swimming Goal',
    goal: 'Pick your distance',
    goalDetail: 'Choose your swim goal and build up to continuous laps.',
    weeks: 6,
    color: '#8B5CF6',
    workoutType: 'Swim',
    goalOptions: [
      { id: '500m',   label: '500m',   targetMi: 0.31, extraWeeks: 0 },
      { id: '1k',     label: '1 km',   targetMi: 0.62, extraWeeks: 2, requiresGoalId: 'swim_1k:500m' },
      { id: '2k',     label: '2 km',   targetMi: 1.24, extraWeeks: 4, requiresGoalId: 'swim_1k:1k' },
      { id: 'custom', label: 'Custom', targetMi: 0,    extraWeeks: 0 },
    ],
    weeklyPlan: [
      { week: 1, sessions: 3, minDuration: 20, description: '200-300m per session, focus on technique' },
      { week: 2, sessions: 3, minDuration: 25, description: 'Build to 400m, work on breathing' },
      { week: 3, sessions: 3, minDuration: 30, description: '500-600m per session, find your rhythm' },
      { week: 4, sessions: 3, minDuration: 35, description: 'Push to 700m, steady pace' },
      { week: 5, sessions: 3, minDuration: 40, description: '800m — almost there!' },
      { week: 6, sessions: 2, minDuration: 30, description: 'Easy swim + goal 1km continuous!' },
    ],
    milestones: [
      { id: 'first_swim',   emoji: '🏊', title: 'First Swim',    description: 'Log your first swim session' },
      { id: 'swim_300m',    emoji: '💧', title: 'Smooth Stroke',  description: 'Complete a 300m swim session' },
      { id: 'week1_swim',   emoji: '🗓️', title: 'Week 1 Done',   description: 'Complete all Week 1 sessions' },
      { id: 'halfway_swim', emoji: '🌗', title: 'Halfway',        description: 'Complete 3 weeks of training' },
      { id: 'swim_800m',    emoji: '⚡', title: 'Deep Diver',     description: 'Complete an 800m swim session' },
      { id: 'goal_swim',    emoji: '🏆', title: '1km Done!',      description: 'Swim 1km continuous — amazing!' },
    ],
  },
  {
    id: 'strength_base',
    icon: '💪',
    title: 'Strength Base',
    goal: '8-week foundation',
    goalDetail: 'Build a solid strength foundation with progressive training.',
    weeks: 8,
    color: '#F97316',
    workoutType: 'Gym',
    weeklyPlan: [
      { week: 1, sessions: 3, minDuration: 30, description: 'Full body basics — learn the movements' },
      { week: 2, sessions: 3, minDuration: 35, description: 'Add weight, focus on form' },
      { week: 3, sessions: 3, minDuration: 40, description: 'Upper/lower split begins' },
      { week: 4, sessions: 4, minDuration: 40, description: '4 sessions — increase frequency' },
      { week: 5, sessions: 4, minDuration: 45, description: 'Progressive overload week' },
      { week: 6, sessions: 4, minDuration: 45, description: 'Deload — lighter weights, same volume' },
      { week: 7, sessions: 4, minDuration: 50, description: 'Peak strength week' },
      { week: 8, sessions: 3, minDuration: 45, description: 'Test your 1-rep maxes and celebrate!' },
    ],
    milestones: [
      { id: 'first_lift',   emoji: '💪', title: 'First Session',  description: 'Log your first strength session' },
      { id: 'ten_sessions', emoji: '🔟', title: '10 Sessions',    description: 'Complete 10 strength sessions' },
      { id: 'week1_lift',   emoji: '🗓️', title: 'Week 1 Done',   description: 'Complete all Week 1 sessions' },
      { id: 'halfway_lift', emoji: '🌗', title: 'Halfway',        description: 'Complete 4 weeks of training' },
      { id: 'consistency',  emoji: '⚡', title: 'Consistent',     description: 'Log 4 sessions in one week' },
      { id: 'goal_lift',    emoji: '🏆', title: 'Foundation!',    description: 'Complete all 8 weeks — strong base built!' },
    ],
  },
  {
    id: 'flexibility',
    icon: '🧘',
    title: 'Flexibility',
    goal: '4-week daily stretch',
    goalDetail: 'A 4-week daily stretching and mobility routine.',
    weeks: 4,
    color: '#39FF14',
    workoutType: 'Yoga',
    weeklyPlan: [
      { week: 1, sessions: 7, minDuration: 20, description: 'Daily 20-min stretches, full body scan' },
      { week: 2, sessions: 7, minDuration: 25, description: 'Add targeted flexibility work' },
      { week: 3, sessions: 7, minDuration: 30, description: '30-min sessions with yoga flows' },
      { week: 4, sessions: 7, minDuration: 30, description: 'Final week — notice how far you\'ve come' },
    ],
    milestones: [
      { id: 'first_stretch', emoji: '🧘', title: 'First Stretch',  description: 'Log your first flexibility session' },
      { id: 'seven_days',    emoji: '7️⃣', title: 'One Week',       description: 'Complete 7 consecutive days' },
      { id: 'week1_flex',    emoji: '🗓️', title: 'Week 1 Done',   description: 'Complete all Week 1 sessions' },
      { id: 'halfway_flex',  emoji: '🌗', title: 'Halfway',        description: 'Complete 2 weeks' },
      { id: 'twenty_days',   emoji: '⚡', title: '20 Sessions',    description: 'Complete 20 flexibility sessions' },
      { id: 'goal_flex',     emoji: '🏆', title: 'Flexible!',      description: 'Complete all 4 weeks — you\'re transformed!' },
    ],
  },
];

// ── Storage — supports multiple concurrent paths ──────────────────────────────

export async function loadActivePaths(): Promise<ActivePath[]> {
  const raw = await AsyncStorage.getItem(PATH_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  // migrate from old single-path format
  return Array.isArray(parsed) ? parsed : [parsed];
}

export async function loadActivePath(pathId: string): Promise<ActivePath | null> {
  const paths = await loadActivePaths();
  return paths.find(p => p.pathId === pathId) ?? null;
}

export async function startPath(pathId: string, customSessionsPerWeek?: number, selectedGoalId?: string, customTargetMi?: number): Promise<void> {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const existing = await loadActivePaths();
  const updated = existing.filter(p => p.pathId !== pathId);
  updated.push({
    pathId, startDate: today, sessions: [],
    ...(customSessionsPerWeek ? { customSessionsPerWeek } : {}),
    ...(selectedGoalId ? { selectedGoalId } : {}),
    ...(customTargetMi ? { customTargetMi } : {}),
  });
  await AsyncStorage.setItem(PATH_KEY, JSON.stringify(updated));
}

export function getSelectedGoal(path: PathDefinition, active?: ActivePath | null) {
  if (!path.goalOptions) return null;
  return path.goalOptions.find(g => g.id === active?.selectedGoalId) ?? path.goalOptions[0];
}

export function getEffectiveSessionsPerWeek(path: PathDefinition, active: ActivePath): number {
  return active.customSessionsPerWeek ?? path.weeklyPlan[0]?.sessions ?? 3;
}

export function getEffectiveWeeks(path: PathDefinition, active: ActivePath): number {
  const totalSessions = path.weeklyPlan.reduce((s, w) => s + w.sessions, 0);
  const spw = getEffectiveSessionsPerWeek(path, active);
  return Math.ceil(totalSessions / spw);
}

export async function stopPath(pathId: string): Promise<void> {
  const existing = await loadActivePaths();
  await AsyncStorage.setItem(PATH_KEY, JSON.stringify(existing.filter(p => p.pathId !== pathId)));
}

// Logs to ALL active paths whose workoutType matches the logged workout type
export async function logPathSession(
  workoutType: string,
  duration: number,
  distanceMi?: number,
): Promise<void> {
  const paths = await loadActivePaths();
  if (!paths.length) return;
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  let updated = false;
  const newPaths = paths.map(ap => {
    const def = ALL_PATHS.find(x => x.id === ap.pathId);
    if (!def || def.workoutType !== workoutType) return ap;
    updated = true;
    return { ...ap, sessions: [...ap.sessions, { date, duration, ...(distanceMi ? { distanceMi } : {}) }] };
  });
  if (updated) await AsyncStorage.setItem(PATH_KEY, JSON.stringify(newPaths));
}

export async function clearActivePath(): Promise<void> {
  await AsyncStorage.removeItem(PATH_KEY);
  await AsyncStorage.removeItem(COMPLETED_GOALS_KEY);
}

const PATH_SEEN_KEY = '@42_path_milestones_seen';
const COMPLETED_GOALS_KEY = '@42_completed_goals';

export async function getCompletedGoals(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(COMPLETED_GOALS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveCompletedGoal(pathId: string, goalId?: string): Promise<void> {
  const key = goalId ? `${pathId}:${goalId}` : pathId;
  const existing = await getCompletedGoals();
  if (!existing.includes(key)) {
    await AsyncStorage.setItem(COMPLETED_GOALS_KEY, JSON.stringify([...existing, key]));
  }
}

export function isGoalUnlocked(goal: GoalOption, completedGoals: string[]): boolean {
  if (!goal.requiresGoalId) return true;
  return completedGoals.includes(goal.requiresGoalId);
}

export async function getSeenPathMilestones(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PATH_SEEN_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function markPathMilestonesSeen(ids: string[]): Promise<void> {
  const existing = await getSeenPathMilestones();
  await AsyncStorage.setItem(PATH_SEEN_KEY, JSON.stringify([...new Set([...existing, ...ids])]));
}

export function getUnlockedPathMilestoneIds(
  path: PathDefinition,
  active: ActivePath,
): string[] {
  const sessions = active.sessions;
  const totalSessions = sessions.length;
  const currentWeek = getCurrentWeek(active.startDate);
  const maxDist = sessions.reduce((m, s) => Math.max(m, s.distanceMi ?? 0), 0);
  const unlocked: string[] = [];

  // Generic unlocks based on path milestones order
  if (totalSessions >= 1)       unlocked.push(path.milestones[0]?.id);  // first session
  // distance milestone (index 1 for run/ride/swim)
  const distTarget = [1.0, 10, 0.19]; // 1mi, 10mi, 300m(≈0.19mi)
  if (['run_5k','ride_50k','swim_1k'].includes(path.id)) {
    const idx = ['run_5k','ride_50k','swim_1k'].indexOf(path.id);
    if (maxDist >= distTarget[idx]) unlocked.push(path.milestones[1]?.id);
  } else if (totalSessions >= 1) {
    unlocked.push(path.milestones[1]?.id); // strength/flex: just sessions
  }
  // week 1 done
  const week1Done = getWeekSessions(sessions, active.startDate, 1).length >= path.weeklyPlan[0].sessions;
  if (week1Done) unlocked.push(path.milestones[2]?.id);
  // halfway (weeks)
  if (currentWeek > Math.floor(path.weeks / 2)) unlocked.push(path.milestones[3]?.id);
  // advanced distance / sessions
  const advDist = [3.0, 25, 0.5];
  if (['run_5k','ride_50k','swim_1k'].includes(path.id)) {
    const idx = ['run_5k','ride_50k','swim_1k'].indexOf(path.id);
    if (maxDist >= advDist[idx]) unlocked.push(path.milestones[4]?.id);
  } else if (path.id === 'strength_base') {
    const weekWithFour = path.weeklyPlan.findIndex((_, w) =>
      getWeekSessions(sessions, active.startDate, w + 1).length >= 4
    ) >= 0;
    if (weekWithFour) unlocked.push(path.milestones[4]?.id);
  } else if (totalSessions >= 20) {
    unlocked.push(path.milestones[4]?.id);
  }
  // goal / complete
  const totalRequired = path.weeklyPlan.reduce((s, w) => s + w.sessions, 0);
  if (totalSessions >= totalRequired) unlocked.push(path.milestones[5]?.id);

  return unlocked.filter(Boolean);
}

// ── Computed helpers ──────────────────────────────────────────────────────────

export function getCurrentWeek(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return Math.min(Math.floor(days / 7) + 1, 99);
}

export function getWeekSessions(sessions: ActivePath['sessions'], startDate: string, week: number) {
  const start = new Date(startDate + 'T00:00:00');
  const weekStart = new Date(start.getTime() + (week - 1) * 7 * 86400000);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
  return sessions.filter(s => {
    const d = new Date(s.date + 'T00:00:00');
    return d >= weekStart && d < weekEnd;
  });
}
