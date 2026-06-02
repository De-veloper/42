import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { saveWorkout, updateWorkout, loadData, getDayNumber, todayString, WorkoutEntry } from '../utils/storage';
import { WORKOUT_TYPES, FEELING_LABELS } from '../utils/fitnessScore';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LogWorkout'>;
  route: RouteProp<RootStackParamList, 'LogWorkout'>;
}

export default function LogWorkoutScreen({ navigation, route }: Props) {
  const existing = route.params?.workout;
  const [workoutType, setWorkoutType] = useState(existing?.type ?? 'Run');
  const [duration, setDuration] = useState(existing ? String(existing.duration) : '');
  const [feeling, setFeeling] = useState<number>(existing?.feeling ?? 3);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(existing?.photoUri ?? null);
  const [saving, setSaving] = useState(false);

  const isEditing = !!existing;

  const handlePickPhoto = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required.'); return; }
            const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] });
            if (!result.canceled) await savePhoto(result.assets[0].uri);
          } catch {
            Alert.alert('Camera unavailable', 'Camera is not available on this device. Use Photo Library instead.');
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Photo library access is required.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [4, 3] });
          if (!result.canceled) await savePhoto(result.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const savePhoto = async (uri: string) => {
    const dir = FileSystem.documentDirectory + 'workout-photos/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const dest = dir + `${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    setPhotoUri(dest);
  };

  const handleSave = async () => {
    const mins = parseInt(duration, 10);
    if (!duration || isNaN(mins) || mins <= 0) {
      Alert.alert('Missing duration', 'Please enter how long you worked out (in minutes).');
      return;
    }
    setSaving(true);
    try {
      const photoField = photoUri ? { photoUri } : {};
      if (isEditing) {
        await updateWorkout({ ...existing, type: workoutType, duration: mins, feeling, notes: notes.trim(), ...photoField });
      } else {
        const { startDate, programStarted } = await loadData();
        if (!programStarted || !startDate) {
          Alert.alert('Start your program first', 'Go to Home and tap "Begin Today".');
          setSaving(false);
          return;
        }
        const dayNumber = getDayNumber(startDate);
        const entry: WorkoutEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          date: todayString(),
          dayNumber,
          type: workoutType,
          duration: mins,
          feeling,
          notes: notes.trim(),
          ...photoField,
        };
        await saveWorkout(entry);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const feelingInfo = FEELING_LABELS[feeling];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Workout' : 'Log Workout'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Workout type */}
          <Text style={styles.sectionLabel}>What did you do?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow} contentContainerStyle={styles.typeRowContent}>
            {WORKOUT_TYPES.map(({ label, icon }) => {
              const selected = workoutType === label;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => setWorkoutType(label)}
                  style={[styles.typeChip, selected && styles.typeChipSelected]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.typeChipIcon}>{icon}</Text>
                  <Text style={[styles.typeChipLabel, selected && styles.typeChipLabelSelected]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Duration */}
          <Text style={styles.sectionLabel}>How long? (minutes)</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g. 30"
              placeholderTextColor="rgba(255,255,255,0.25)"
              keyboardType="number-pad"
              returnKeyType="done"
              maxLength={4}
            />
            <Text style={styles.inputUnit}>min</Text>
          </View>

          {/* Quick duration pills */}
          <View style={styles.quickDurationRow}>
            {[15, 20, 30, 45, 60, 90].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.quickPill, duration === String(m) && styles.quickPillSelected]}
                onPress={() => setDuration(String(m))}
              >
                <Text style={[styles.quickPillText, duration === String(m) && styles.quickPillTextSelected]}>
                  {m}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Feeling */}
          <Text style={styles.sectionLabel}>How did it feel?</Text>
          <View style={styles.feelingRow}>
            {[1, 2, 3, 4, 5].map(n => {
              const info = FEELING_LABELS[n];
              const selected = feeling === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.feelingBtn, selected && { borderColor: info.color, backgroundColor: `${info.color}22` }]}
                  onPress={() => setFeeling(n)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.feelingEmoji}>{info.emoji}</Text>
                  <Text style={[styles.feelingLabel, selected && { color: info.color }]}>{info.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected feeling callout */}
          <View style={[styles.feelingCallout, { borderColor: `${feelingInfo.color}44` }]}>
            <Text style={[styles.feelingCalloutText, { color: feelingInfo.color }]}>
              {feelingInfo.emoji}  Feeling {feelingInfo.label.toLowerCase()} today
            </Text>
          </View>

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes  <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Route, PR, how the session went..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="default"
          />

          {/* Photo */}
          <Text style={styles.sectionLabel}>Photo  <Text style={styles.optional}>(optional)</Text></Text>
          {photoUri ? (
            <View style={styles.photoPreviewWrapper}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setPhotoUri(null)}>
                <Text style={styles.photoRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoPickerBtn} onPress={handlePickPhoto} activeOpacity={0.8}>
              <Text style={styles.photoPickerIcon}>📷</Text>
              <Text style={styles.photoPickerText}>Add a photo or selfie</Text>
            </TouchableOpacity>
          )}

          {/* Save */}
          <TouchableOpacity
            style={styles.saveBtnWrapper}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            <View style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>
              <Text style={[styles.saveBtnText, saving && { color: '#555' }]}>
                {saving ? 'Saving…' : 'Save Workout'}
              </Text>
            </View>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020B18' },
  bg: { ...StyleSheet.absoluteFill },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  cancelBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  cancelText: { color: '#00E5CC', fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  scroll: { paddingHorizontal: 24, paddingBottom: 48 },

  sectionLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 12,
  },
  optional: { color: 'rgba(255,255,255,0.3)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 },

  // Type chips
  typeRow: { marginHorizontal: -24 },
  typeRowContent: { paddingHorizontal: 24, gap: 10 },
  typeChip: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeChipSelected: {
    backgroundColor: 'rgba(0,229,204,0.15)',
    borderColor: '#00E5CC',
  },
  typeChipIcon: { fontSize: 22 },
  typeChipLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  typeChipLabelSelected: { color: '#00E5CC' },

  // Duration
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 18,
    height: 56,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  inputUnit: { color: 'rgba(255,255,255,0.4)', fontSize: 16, marginLeft: 8 },

  quickDurationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  quickPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickPillSelected: { backgroundColor: 'rgba(0,229,204,0.15)', borderColor: '#00E5CC' },
  quickPillText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  quickPillTextSelected: { color: '#00E5CC' },

  // Feeling
  feelingRow: { flexDirection: 'row', gap: 8 },
  feelingBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  feelingEmoji: { fontSize: 22 },
  feelingLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  feelingCallout: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
  },
  feelingCalloutText: { fontSize: 15, fontWeight: '600' },

  // Notes
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 110,
  },

  // Photo
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  photoPickerIcon: { fontSize: 22 },
  photoPickerText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },
  photoPreviewWrapper: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  photoPreview: { width: '100%', height: 200, borderRadius: 14 },
  photoRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Save
  saveBtnWrapper: {
    marginTop: 36,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00E5CC',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  saveBtn: { paddingVertical: 18, alignItems: 'center', borderRadius: 16, backgroundColor: '#00E5CC' },
  saveBtnDisabled: { backgroundColor: '#1a1a2e' },
  saveBtnText: { color: '#020B18', fontSize: 17, fontWeight: '800' },
});
