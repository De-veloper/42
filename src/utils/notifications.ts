import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REMINDER_HOUR_KEY = '@42_reminder_hour';
const REMINDER_MIN_KEY  = '@42_reminder_min';

export const DEFAULT_HOUR = 20; // 8 PM
export const DEFAULT_MIN  = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getSavedReminderTime(): Promise<{ hour: number; min: number }> {
  const [h, m] = await Promise.all([
    AsyncStorage.getItem(REMINDER_HOUR_KEY),
    AsyncStorage.getItem(REMINDER_MIN_KEY),
  ]);
  return {
    hour: h != null ? parseInt(h) : DEFAULT_HOUR,
    min:  m != null ? parseInt(m) : DEFAULT_MIN,
  };
}

export async function saveReminderTime(hour: number, min: number) {
  await Promise.all([
    AsyncStorage.setItem(REMINDER_HOUR_KEY, String(hour)),
    AsyncStorage.setItem(REMINDER_MIN_KEY, String(min)),
  ]);
}

export async function scheduleDailyReminder(hour: number, min: number) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "42 — Don't break the chain 💪",
      body: "Log today's workout and keep your streak alive!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: min,
    },
  });
}

export async function cancelReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "42 — Test notification 🏃",
      body: "Notifications are working! You'll be reminded daily.",
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
}
