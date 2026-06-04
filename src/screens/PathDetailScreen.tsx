import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Alert, Modal, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { ALL_PATHS, startPath, stopPath, loadActivePath, getEffectiveWeeks, GoalOption, getCompletedGoals, isGoalUnlocked, saveCompletedGoal } from '../utils/paths';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PathDetail'>;
  route: RouteProp<RootStackParamList, 'PathDetail'>;
}

export default function PathDetailScreen({ navigation, route }: Props) {
  const { pathId, fromCompletion } = route.params;
  const path = ALL_PATHS.find(p => p.id === pathId)!;
  const defaultSPW = path.weeklyPlan[0]?.sessions ?? 3;
  const [hasActivePath, setHasActivePath] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(defaultSPW);
  const [selectedGoal, setSelectedGoal] = useState<GoalOption | null>(path.goalOptions?.[0] ?? null);
  const [customMiles, setCustomMiles] = useState('');
  const [completedGoals, setCompletedGoals] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([loadActivePath(pathId), getCompletedGoals()]).then(([ap, cg]) => {
      setHasActivePath(!!ap);
      setCompletedGoals(cg);
    });
  }, []);

  const baseWeeks = Math.ceil(
    path.weeklyPlan.reduce((s, w) => s + w.sessions, 0) / sessionsPerWeek
  );
  const customWeeks = baseWeeks + (selectedGoal?.extraWeeks ?? 0);

  const handleStartTap = async () => {
    const seen = await AsyncStorage.getItem('@42_path_disclaimer_seen');
    if (!seen) {
      setShowDisclaimer(true);
    } else {
      await doStart();
    }
  };

  const doStart = async () => {
    if (selectedGoal?.id === 'custom' && (!customMiles || parseFloat(customMiles) <= 0)) {
      Alert.alert('Enter your goal', 'Please enter a distance in miles.');
      return;
    }
    if (fromCompletion) {
      await stopPath(pathId);
    }
    const custom = sessionsPerWeek !== defaultSPW ? sessionsPerWeek : undefined;
    const customMi = selectedGoal?.id === 'custom' ? parseFloat(customMiles) : undefined;
    await startPath(pathId, custom, selectedGoal?.id, customMi);
    setHasActivePath(true);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#020B18', '#041428', '#020B18']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>{path.icon}</Text>
          <Text style={styles.heroTitle}>{path.title}</Text>
          <Text style={styles.heroGoal}>{path.goalDetail}</Text>

          <View style={[styles.metaRow]}>
            <View style={styles.metaChip}>
              <Text style={styles.metaValue}>{customWeeks}</Text>
              <Text style={styles.metaLabel}>Weeks</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaValue}>{path.weeklyPlan.reduce((s,w) => s + w.sessions, 0)}</Text>
              <Text style={styles.metaLabel}>Sessions</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaValue}>{path.workoutType}</Text>
              <Text style={styles.metaLabel}>Type</Text>
            </View>
          </View>
        </View>

        {/* Goal picker — shown first, above weekly plan */}
        {path.goalOptions && (() => {
          // Max custom = highest unlocked real goal × 1.2, rounded to nearest 5
          const unlockedPresets = path.goalOptions!
            .filter(g => g.id !== 'custom' && isGoalUnlocked(g, completedGoals));
          const highestUnlocked = unlockedPresets.reduce((m, g) => Math.max(m, g.targetMi), 0);
          const maxCustom = highestUnlocked > 0 ? Math.round(highestUnlocked * 1.2 / 5) * 5 : null;
          return (
          <View style={[styles.freqCard, { marginBottom: 20 }]}>
            <Text style={styles.freqTitle}>Choose your goal</Text>
            <View style={styles.freqRow}>
              {path.goalOptions.map(g => {
                const sel = selectedGoal?.id === g.id;
                const unlocked = isGoalUnlocked(g, completedGoals);
                const reqLabel = g.requiresGoalId
                  ? path.goalOptions?.find(x => `${pathId}:${x.id}` === g.requiresGoalId)?.label
                  : null;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.freqPill,
                      sel && { backgroundColor: `${path.color}22`, borderColor: path.color },
                      !unlocked && { opacity: 0.45 },
                    ]}
                    onPress={() => {
                      if (!unlocked) {
                        Alert.alert('Locked 🔒', `Complete the ${reqLabel} challenge first to unlock this goal.`);
                        return;
                      }
                      setSelectedGoal(g);
                    }}
                  >
                    <Text style={[styles.freqPillNum, { fontSize: g.label.length > 5 ? 12 : 15 }, sel && { color: path.color }]}>
                      {unlocked ? g.label : `🔒 ${g.label}`}
                    </Text>
                    <Text style={styles.freqPillRec}>{g.targetMi} mi</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedGoal?.id === 'custom' && (
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  value={customMiles}
                  onChangeText={v => {
                    const n = parseFloat(v);
                    if (maxCustom && n > maxCustom) {
                      Alert.alert('Locked 🔒', `Unlock the next level first. Max custom distance is ${maxCustom} miles right now.`);
                      return;
                    }
                    setCustomMiles(v);
                  }}
                  placeholder={maxCustom ? `up to ${maxCustom} mi` : 'e.g. 35'}
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                <Text style={styles.customInputUnit}>miles</Text>
              </View>
            )}
            <Text style={styles.freqResult}>
              {selectedGoal?.id === 'custom'
                ? customMiles
                  ? `Custom goal: ${customMiles} miles${maxCustom ? ` (max ${maxCustom})` : ''}`
                  : `Enter your target distance${maxCustom ? ` — up to ${maxCustom} mi` : ''}`
                : selectedGoal ? `Target: ${selectedGoal.targetMi} miles · ${customWeeks} weeks` : ''}
            </Text>
          </View>
          );
        })()}

        {/* Weekly plan — adapts to chosen sessions/week */}
        <Text style={styles.sectionTitle}>Weekly Plan</Text>
        {Array.from({ length: customWeeks }, (_, i) => {
          const origIdx = Math.floor(i * path.weeklyPlan.length / customWeeks);
          const orig = path.weeklyPlan[origIdx];
          return (
            <View key={i} style={styles.weekRow}>
              <View style={[styles.weekBadge, { borderColor: path.color }]}>
                <Text style={[styles.weekNum, { color: path.color }]}>W{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.weekDesc}>{orig.description}</Text>
                <Text style={styles.weekMeta}>
                  {sessionsPerWeek}× per week · {orig.minDuration}+ min
                  {orig.targetMi ? `  ·  ${orig.targetMi} mi target` : ''}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Session frequency picker */}
        {!hasActivePath && (
          <View style={styles.freqCard}>
            <Text style={styles.freqTitle}>Sessions per week</Text>
            <View style={styles.freqRow}>
              {[1, 2, 3, 4].map(n => {
                const isDefault = n === defaultSPW;
                const selected = sessionsPerWeek === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.freqPill, selected && { backgroundColor: `${path.color}22`, borderColor: path.color }]}
                    onPress={() => setSessionsPerWeek(n)}
                  >
                    <Text style={[styles.freqPillNum, selected && { color: path.color }]}>{n}x</Text>
                    {isDefault && <Text style={styles.freqPillRec}>rec.</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.freqResult}>
              {(() => {
                const isLongGoal = (selectedGoal?.extraWeeks ?? 0) > 0;
                const isLongerGoal = (selectedGoal?.extraWeeks ?? 0) > 0;
                if (sessionsPerWeek === 1 && isLongerGoal)
                  return `⚠️ 1x/week for ${selectedGoal?.label} is very ambitious — consider starting with 5K or increasing to 2x/week`;
                if (sessionsPerWeek === 1)
                  return `⚠️ 1x/week is slow — we suggest ${defaultSPW}x for best results`;
                if (sessionsPerWeek < defaultSPW && isLongerGoal)
                  return `${customWeeks} weeks — totally doable, just a longer journey 💪`;
                if (sessionsPerWeek === defaultSPW)
                  return `${customWeeks} weeks — recommended pace`;
                return `${customWeeks} weeks at your pace`;
              })()}
            </Text>
          </View>
        )}

        {/* CTA */}
        <View style={{ height: 32 }} />
        {hasActivePath && !fromCompletion ? (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.replace('PathProgress', { pathId })}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue My Progress →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startBtnWrapper} onPress={handleStartTap} activeOpacity={0.85}>
            <LinearGradient
              colors={['#00BFFF', '#00E5CC', '#39FF14']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.startBtnText}>Start {path.title}</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Health & Safety Disclaimer */}
      <Modal visible={showDisclaimer} transparent animationType="fade" onRequestClose={() => setShowDisclaimer(false)}>
        <View style={styles.disclaimerOverlay}>
          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerEmoji}>⚠️</Text>
            <Text style={styles.disclaimerTitle}>Before You Start</Text>
            <Text style={styles.disclaimerBody}>
              {`This training plan is for general fitness purposes only and is NOT a substitute for professional medical advice.\n\n`}
              {`• Consult a doctor before starting any new exercise program, especially if you have any medical conditions.\n`}
              {`• Stop immediately and seek medical attention if you experience pain, dizziness, or shortness of breath.\n`}
              {`• Progress at your own pace — it's okay to repeat weeks.\n`}
              {`• Warm up before and cool down after every session.\n\n`}
              {`By continuing, you acknowledge these risks and accept full responsibility for your training.`}
            </Text>
            <TouchableOpacity
              style={styles.disclaimerBtn}
              onPress={async () => {
                await AsyncStorage.setItem('@42_path_disclaimer_seen', 'true');
                setShowDisclaimer(false);
                await doStart();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.disclaimerBtnText}>I Understand — Let's Go</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDisclaimer(false)} style={{ marginTop: 12 }}>
              <Text style={styles.disclaimerCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020B18' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { paddingVertical: 6 },
  backText: { color: '#00E5CC', fontSize: 17 },
  scroll: { paddingHorizontal: 24 },

  hero: { alignItems: 'center', paddingTop: 8, paddingBottom: 32 },
  heroIcon: { fontSize: 64, marginBottom: 12 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 10 },
  heroGoal: { fontSize: 16, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaChip: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  metaValue: { fontSize: 20, fontWeight: '900', color: '#00E5CC' },
  metaLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
  },

  weekRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    marginBottom: 14, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  weekBadge: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  weekNum: { fontSize: 13, fontWeight: '800' },
  weekDesc: { fontSize: 15, color: '#fff', fontWeight: '600', marginBottom: 4 },
  weekMeta: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },

  startBtnWrapper: {
    borderRadius: 16, overflow: 'hidden',
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#00E5CC', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
  },
  startBtnText: { color: '#020B18', fontSize: 17, fontWeight: '800' },
  continueBtn: {
    paddingVertical: 18, alignItems: 'center', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,229,204,0.35)',
    backgroundColor: 'rgba(0,229,204,0.08)',
  },
  continueBtnText: { color: '#00E5CC', fontSize: 17, fontWeight: '700' },

  // Disclaimer modal
  disclaimerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  disclaimerCard: {
    backgroundColor: '#041428', borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: '85%',
  },
  disclaimerEmoji: { fontSize: 40, textAlign: 'center', marginBottom: 12 },
  disclaimerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 16 },
  disclaimerBody: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22, marginBottom: 24 },
  disclaimerBtn: {
    backgroundColor: '#00E5CC', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  disclaimerBtnText: { color: '#020B18', fontSize: 16, fontWeight: '800' },
  disclaimerCancel: { color: 'rgba(255,255,255,0.3)', fontSize: 14, textAlign: 'center' },

  // Frequency picker
  freqCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 4,
  },
  freqTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 },
  freqRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  freqPill: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  freqPillNum: { fontSize: 20, fontWeight: '800', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
  freqPillRec: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  freqResult: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 18 },
  customInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  customInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, color: '#fff',
    fontSize: 20, fontWeight: '700', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  customInputUnit: { color: 'rgba(255,255,255,0.4)', fontSize: 16 },
});
