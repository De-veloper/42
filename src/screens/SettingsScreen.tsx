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
import { resetAll, loadRestDays } from '../utils/storage';
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
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
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
