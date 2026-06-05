import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetAll, loadRestDays, saveWorkout, saveStartDate, saveProgramStarted } from '../utils/storage';
import { ALL_PATHS, startPath, logPathSession, saveCompletedGoal, clearActivePath } from '../utils/paths';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelReminders,
  getSavedReminderTime,
  saveReminderTime,
  DEFAULT_HOUR,
} from '../utils/notifications';
import { resetMilestones } from '../utils/milestones';

const NAME_KEY = '@42_user_name';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
}

export default function SettingsScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [reminderHour, setReminderHour] = useState(DEFAULT_HOUR);
  const [programStarted, setProgramStarted] = useState(false);

  useEffect(() => {
    (async () => {
      const [savedName, { hour }, started] = await Promise.all([
        AsyncStorage.getItem(NAME_KEY),
        getSavedReminderTime(),
        AsyncStorage.getItem('@42_program_started'),
      ]);
      if (savedName) setName(savedName);
      setReminderHour(hour);
      setProgramStarted(started === 'true');
    })();
  }, []);

  const handleSaveName = async (value: string) => {
    setName(value);
    await AsyncStorage.setItem(NAME_KEY, value);
  };

  // Loads a completed 42-day challenge in the background (needed by path demos)
  const setup42DaysComplete = async (fmt: (d: Date) => string) => {
    const challengeStart = new Date(); challengeStart.setDate(challengeStart.getDate() - 41);
    await saveStartDate(fmt(challengeStart)); await saveProgramStarted(true);
    const types = ['Run','Gym','Ride','Walk','Yoga','Gym','Run','Swim'];
    const skipDays = new Set([6,13,20,27,34]);
    for (let day = 1; day <= 42; day++) {
      if (skipDays.has(day)) continue;
      const date = new Date(challengeStart); date.setDate(challengeStart.getDate() + (day-1));
      const type = types[(day-1)%types.length];
      const dur = 20+Math.floor(Math.sin(day*0.4)*15+Math.random()*25);
      await saveWorkout({ id:`bg42-${day}`, date:fmt(date), dayNumber:day, type, duration:dur, feeling:Math.min(5,Math.max(1,2+Math.floor(day/10))), notes:'' });
    }
  };

  // Hidden demo triggers for App Store review — type these as name then tap away
  const handleNameBlur = async (value: string) => {
    const trigger = value.toLowerCase().trim();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    if (trigger === 'demo.2weeks') {
      const DAYS = 14;
      const start = new Date(); start.setDate(start.getDate() - (DAYS - 1));
      await resetAll(); await resetMilestones(); await clearActivePath();
      await saveStartDate(fmt(start)); await saveProgramStarted(true);
      const types = ['Run','Gym','Walk','Run','Gym','Ride','Yoga'];
      for (let day = 1; day <= DAYS; day++) {
        if ([4,7,11].includes(day)) continue;
        const date = new Date(start); date.setDate(start.getDate() + (day - 1));
        const type = types[(day-1)%types.length];
        await saveWorkout({ id:`d2w-${day}`, date:fmt(date), dayNumber:day, type, duration:25+Math.floor(Math.random()*25), feeling:Math.min(5,3+Math.floor(day/6)), notes:'' });
      }
      setName(''); await AsyncStorage.removeItem(NAME_KEY);
      Alert.alert('Demo: 2 Weeks', 'Loaded 2 weeks of progress. Check the Home screen.');

    } else if (trigger === 'demo.42days') {
      const start = new Date(); start.setDate(start.getDate() - 41);
      await resetAll(); await resetMilestones(); await clearActivePath();
      await saveStartDate(fmt(start)); await saveProgramStarted(true);
      const types = ['Run','Gym','Ride','Walk','Yoga','Gym','Run','Swim'];
      const skipDays = new Set([6,13,20,27,34]);
      for (let day = 1; day <= 42; day++) {
        if (skipDays.has(day)) continue;
        const date = new Date(start); date.setDate(start.getDate() + (day-1));
        const type = types[(day-1)%types.length];
        const dur = 20+Math.floor(Math.sin(day*0.4)*15+Math.random()*25);
        await saveWorkout({ id:`d42-${day}`, date:fmt(date), dayNumber:day, type, duration:dur, feeling:Math.min(5,Math.max(1,2+Math.floor(day/10))), notes:'' });
      }
      setName(''); await AsyncStorage.removeItem(NAME_KEY);
      Alert.alert('Demo: 42 Days Complete', 'Challenge complete! Check the Home screen.');

    } else if (trigger === 'demo.5k') {
      await resetAll(); await resetMilestones(); await clearActivePath();
      await setup42DaysComplete(fmt);
      const path = ALL_PATHS.find(p => p.id === 'run_5k')!;
      const totalSessions = path.weeklyPlan.reduce((s,w) => s+w.sessions, 0);
      const start = new Date(); start.setDate(start.getDate() - path.weeks*7 - 1);
      await startPath('run_5k');
      const raw = await AsyncStorage.getItem('@42_active_path');
      if (raw) {
        const paths = JSON.parse(raw);
        const idx = paths.findIndex((p:any) => p.pathId === 'run_5k');
        if (idx >= 0) {
          paths[idx].startDate = fmt(start);
          paths[idx].selectedGoalId = '5k';
          paths[idx].sessions = Array.from({length:totalSessions},(_,i) => {
            const d = new Date(start); d.setDate(start.getDate()+Math.floor(i*path.weeks*7/totalSessions));
            return {date:fmt(d), duration:25+Math.floor(Math.random()*20), distanceMi:parseFloat((1.5+i*0.1).toFixed(2))};
          });
          await AsyncStorage.setItem('@42_active_path', JSON.stringify(paths));
        }
      }
      await saveCompletedGoal('run_5k', '5k');
      setName(''); await AsyncStorage.removeItem(NAME_KEY);
      Alert.alert('Demo: 5K Complete', '10K is now unlocked. Open the path from home.');

    } else if (trigger === 'demo.25mi') {
      await resetAll(); await resetMilestones(); await clearActivePath();
      await setup42DaysComplete(fmt);
      const path = ALL_PATHS.find(p => p.id === 'ride_50k')!;
      const totalSessions = path.weeklyPlan.reduce((s,w) => s+w.sessions, 0);
      const start = new Date(); start.setDate(start.getDate() - path.weeks*7 - 1);
      await startPath('ride_50k');
      const raw = await AsyncStorage.getItem('@42_active_path');
      if (raw) {
        const paths = JSON.parse(raw);
        const idx = paths.findIndex((p:any) => p.pathId === 'ride_50k');
        if (idx >= 0) {
          paths[idx].startDate = fmt(start);
          paths[idx].selectedGoalId = '25mi';
          paths[idx].sessions = Array.from({length:totalSessions},(_,i) => {
            const d = new Date(start); d.setDate(start.getDate()+Math.floor(i*path.weeks*7/totalSessions));
            return {date:fmt(d), duration:45+Math.floor(Math.random()*30), distanceMi:parseFloat((5+i*1.5).toFixed(2))};
          });
          await AsyncStorage.setItem('@42_active_path', JSON.stringify(paths));
        }
      }
      await saveCompletedGoal('ride_50k', '25mi');
      setName(''); await AsyncStorage.removeItem(NAME_KEY);
      Alert.alert('Demo: 25mi Complete', '50mi ride is now unlocked. Open the path from home.');

    } else if (trigger === 'demo.swim500') {
      await resetAll(); await resetMilestones(); await clearActivePath();
      await setup42DaysComplete(fmt);
      const path = ALL_PATHS.find(p => p.id === 'swim_1k')!;
      const totalSessions = path.weeklyPlan.reduce((s,w) => s+w.sessions, 0);
      const start = new Date(); start.setDate(start.getDate() - path.weeks*7 - 1);
      await startPath('swim_1k');
      const raw = await AsyncStorage.getItem('@42_active_path');
      if (raw) {
        const paths = JSON.parse(raw);
        const idx = paths.findIndex((p:any) => p.pathId === 'swim_1k');
        if (idx >= 0) {
          paths[idx].startDate = fmt(start);
          paths[idx].selectedGoalId = '500m';
          paths[idx].sessions = Array.from({length:totalSessions},(_,i) => {
            const d = new Date(start); d.setDate(start.getDate()+Math.floor(i*path.weeks*7/totalSessions));
            return {date:fmt(d), duration:25+Math.floor(Math.random()*20), distanceMi:parseFloat((0.1+i*0.015).toFixed(3))};
          });
          await AsyncStorage.setItem('@42_active_path', JSON.stringify(paths));
        }
      }
      await saveCompletedGoal('swim_1k', '500m');
      setName(''); await AsyncStorage.removeItem(NAME_KEY);
      Alert.alert('Demo: 500m Swim Complete', '1km swim is now unlocked. Open the path from home.');
    }
  };

  const handleChangeReminder = async (hour: number) => {
    setReminderHour(hour);
    await saveReminderTime(hour, 0);
    const granted = await requestNotificationPermission();
    if (granted && programStarted) await scheduleDailyReminder(hour, 0);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Program',
      'This will clear all workouts, progress, and milestones. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            await cancelReminders();
            await resetMilestones();
            await clearActivePath();
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
          },
        },
      ]
    );
  };

  const handleLoadWeeksMockData = () => {
    Alert.alert(
      'Load 2-Week Sample',
      'Resets data and loads 2 weeks of workouts — good for testing the progress chart mid-journey.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: async () => {
            await resetAll();
            await resetMilestones();
            await clearActivePath();

            const DAYS = 14;
            const start = new Date();
            start.setDate(start.getDate() - (DAYS - 1));
            const fmt = (d: Date) =>
              `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

            await saveStartDate(fmt(start));
            await saveProgramStarted(true);

            const types = ['Run','Gym','Walk','Run','Gym','Ride','Yoga'];
            const restDays = new Set([4, 7, 11]);

            for (let day = 1; day <= DAYS; day++) {
              if (restDays.has(day)) continue;
              const date = new Date(start);
              date.setDate(start.getDate() + (day - 1));
              const type = types[(day - 1) % types.length];
              const duration = 25 + Math.floor(Math.random() * 25);
              const feeling = 3 + Math.floor(day / 6);
              const distanceMi = (type === 'Run' || type === 'Ride')
                ? Math.round((duration * 0.075 + Math.random()) * 100) / 100
                : undefined;
              await saveWorkout({
                id: `mock2w-${day}-${Date.now()}`,
                date: fmt(date),
                dayNumber: day,
                type,
                duration,
                feeling: Math.min(feeling, 5),
                notes: '',
                ...(distanceMi ? { distanceMi } : {}),
              });
            }
            Alert.alert('Done!', '2 weeks of workouts loaded.');
          },
        },
      ]
    );
  };

  const handleLoadCompletedPath = () => {
    Alert.alert(
      'Load Completed Path',
      'Starts a Run a 5K path and fills it with enough sessions to trigger Goal Achieved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: async () => {
            const path = ALL_PATHS.find(p => p.id === 'run_5k')!;
            const totalSessions = path.weeklyPlan.reduce((s, w) => s + w.sessions, 0);
            // Start date far enough back that all weeks have passed
            const weeksNeeded = path.weeks;
            const start = new Date();
            start.setDate(start.getDate() - weeksNeeded * 7 - 1);
            const fmt = (d: Date) =>
              `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            await startPath('run_5k');
            // Patch the start date directly in storage
            const raw = await AsyncStorage.getItem('@42_active_path');
            if (raw) {
              const paths = JSON.parse(raw);
              const idx = paths.findIndex((p: any) => p.pathId === 'run_5k');
              if (idx >= 0) {
                paths[idx].startDate = fmt(start);
                // Add all required sessions spread across the weeks
                const sessions = [];
                for (let i = 0; i < totalSessions; i++) {
                  const d = new Date(start);
                  d.setDate(start.getDate() + Math.floor(i * weeksNeeded * 7 / totalSessions));
                  sessions.push({ date: fmt(d), duration: 25 + Math.floor(Math.random() * 20), distanceMi: parseFloat((1.5 + i * 0.1).toFixed(2)) });
                }
                paths[idx].sessions = sessions;
                paths[idx].selectedGoalId = '5k'; // mark as 5K goal
                await AsyncStorage.setItem('@42_active_path', JSON.stringify(paths));
              }
            }
            // Save 5K as completed so 10K unlocks
            await saveCompletedGoal('run_5k', '5k');
            Alert.alert('Done!', 'Run a 5K path loaded as complete. Open it from the home page banner. 10K is now unlocked!');
          },
        },
      ]
    );
  };

  const hourLabel = (h: number) => h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <Text style={styles.sectionHeader}>Profile</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Your name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={handleSaveName}
            onBlur={() => handleNameBlur(name)}
            onSubmitEditing={() => handleNameBlur(name)}
            placeholder="e.g. Alex"
            placeholderTextColor="rgba(255,255,255,0.25)"
            returnKeyType="done"
          />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Daily reminder time</Text>
          <View style={styles.pills}>
            {[6, 7, 12, 17, 18, 20].map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.pill, reminderHour === h && styles.pillActive]}
                onPress={() => handleChangeReminder(h)}
              >
                <Text style={[styles.pillText, reminderHour === h && styles.pillTextActive]}>
                  {hourLabel(h)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Program */}
        <Text style={styles.sectionHeader}>Program</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Current status</Text>
          <Text style={styles.statusText}>
            {programStarted ? '✅ Program in progress' : '⏳ Not started yet'}
          </Text>
        </View>

        {/* Danger zone */}
        <Text style={[styles.sectionHeader, { color: '#EF4444' }]}>Danger Zone</Text>
        <TouchableOpacity style={styles.resetCard} onPress={handleReset} activeOpacity={0.8}>
          <Text style={styles.resetTitle}>Reset Program</Text>
          <Text style={styles.resetSubtitle}>Clears all workouts, progress, milestones and restarts from Day 1.</Text>
        </TouchableOpacity>

        {/* About */}
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App</Text>
            <Text style={styles.aboutValue}>42 — 42-Day Challenge</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020B18' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 4, minWidth: 60 },
  backText: { color: '#00E5CC', fontSize: 17 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  scroll: { paddingHorizontal: 20 },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 28,
    marginBottom: 10,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },

  fieldLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillActive: { backgroundColor: 'rgba(0,229,204,0.15)', borderColor: '#00E5CC' },
  pillText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#00E5CC' },
  statusText: { fontSize: 15, color: '#fff', fontWeight: '600' },

  resetCard: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  resetTitle: { fontSize: 15, fontWeight: '700', color: '#EF4444', marginBottom: 4 },
  resetSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 18 },

  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aboutLabel: { fontSize: 14, color: 'rgba(255,255,255,0.45)' },
  aboutValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
