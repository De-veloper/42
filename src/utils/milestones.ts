import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutEntry } from './storage';
import { FitnessScore } from './fitnessScore';

export interface Milestone {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export const ALL_MILESTONES: Milestone[] = [
  { id: 'first_sweat',   emoji: '🔥', title: 'First Sweat',     description: 'Log your very first workout'         },
  { id: 'hat_trick',     emoji: '3️⃣', title: 'Hat Trick',       description: '3-day streak'                        },
  { id: 'week_one',      emoji: '🗓️', title: 'Week One',         description: 'Reach Day 7'                         },
  { id: 'dedicated',     emoji: '💪', title: 'Dedicated',        description: 'Log 10 workouts'                     },
  { id: 'week_two',      emoji: '📅', title: 'Week Two',         description: 'Reach Day 14'                        },
  { id: 'streak_seven',  emoji: '⚡', title: 'On Fire',          description: '7-day streak'                        },
  { id: 'halfway',       emoji: '🌗', title: 'Halfway There',    description: 'Reach Day 21 — the halfway mark'     },
  { id: 'warrior',       emoji: '🏅', title: 'Warrior',          description: 'Log 21 workouts'                     },
  { id: 'week_four',     emoji: '🔑', title: 'Week Four',        description: 'Reach Day 28'                        },
  { id: 'home_stretch',  emoji: '🚀', title: 'Home Stretch',     description: 'Reach Day 35'                        },
  { id: 'champion',      emoji: '🏆', title: '42-Day Champion',  description: 'Complete the full 42-day challenge'  },
];

const SEEN_KEY = '@42_milestones_seen';

export async function getSeenMilestones(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(SEEN_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function markMilestonesSeen(ids: string[]): Promise<void> {
  const existing = await getSeenMilestones();
  const merged = Array.from(new Set([...existing, ...ids]));
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(merged));
}

export async function resetMilestones(): Promise<void> {
  await AsyncStorage.removeItem(SEEN_KEY);
}

export function getUnlockedIds(
  workouts: WorkoutEntry[],
  currentDay: number,
  score: FitnessScore,
): string[] {
  const completedDays = new Set(workouts.map(w => w.dayNumber)).size;
  const sessions = workouts.length;
  const unlocked: string[] = [];

  if (sessions >= 1)         unlocked.push('first_sweat');
  if (score.streak >= 3)     unlocked.push('hat_trick');
  if (currentDay >= 7)       unlocked.push('week_one');
  if (sessions >= 10)        unlocked.push('dedicated');
  if (currentDay >= 14)      unlocked.push('week_two');
  if (score.streak >= 7)     unlocked.push('streak_seven');
  if (currentDay >= 21)      unlocked.push('halfway');
  if (completedDays >= 21)   unlocked.push('warrior');
  if (currentDay >= 28)      unlocked.push('week_four');
  if (currentDay >= 35)      unlocked.push('home_stretch');
  if (currentDay >= 42 && completedDays >= 38) unlocked.push('champion');

  return unlocked;
}
