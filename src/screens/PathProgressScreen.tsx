import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Alert, Modal,
} from 'react-native';
import ViewShot, { ViewShotRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import {
  ALL_PATHS, loadActivePath, loadActivePaths, stopPath, saveCompletedGoal, getCompletedGoals, isGoalUnlocked,
  getCurrentWeek, getWeekSessions, ActivePath,
  getUnlockedPathMilestoneIds, getSeenPathMilestones, markPathMilestonesSeen,
  getEffectiveSessionsPerWeek, getEffectiveWeeks,
  PathMilestone,
} from '../utils/paths';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PathProgress'>;
  route: RouteProp<RootStackParamList, 'PathProgress'>;
}

export default function PathProgressScreen({ navigation, route }: Props) {
  const { pathId } = route.params;
  const path = ALL_PATHS.find(p => p.id === pathId)!;
  const [activePath, setActivePath] = useState<ActivePath | null>(null);
  const [allActivePaths, setAllActivePaths] = useState<ActivePath[]>([]);
  const [completedGoalsList, setCompletedGoalsList] = useState<string[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [newMilestone, setNewMilestone] = useState<PathMilestone | null>(null);
  const shareCardRef = useRef<ViewShotRef>(null);

  const handleShare = async () => {
    try {
      const tempUri = await shareCardRef.current!.capture();
      const dest = FileSystem.documentDirectory + 'path-complete.png';
      await FileSystem.copyAsync({ from: tempUri, to: dest });
      await Sharing.shareAsync(dest, { mimeType: 'image/png', dialogTitle: 'Share your achievement' });
    } catch {
      Alert.alert('Could not share', 'Please try again.');
    }
  };

  useFocusEffect(useCallback(() => {
    Promise.all([loadActivePath(pathId), loadActivePaths(), getCompletedGoals()]).then(async ([ap, all, cg]) => {
      setActivePath(ap);
      setAllActivePaths(all);
      setCompletedGoalsList(cg);
      if (!ap) return;
      const p = ALL_PATHS.find(x => x.id === ap.pathId);
      if (!p) return;
      const unlocked = getUnlockedPathMilestoneIds(p, ap);
      setUnlockedIds(unlocked);
      const seen = await getSeenPathMilestones();
      const newlyUnlocked = unlocked.filter(id => !seen.includes(id));
      if (newlyUnlocked.length > 0) {
        const m = p.milestones.find(x => x.id === newlyUnlocked[0]);
        if (m) setNewMilestone(m);
        await markPathMilestonesSeen(newlyUnlocked);
      }
    });
  }, []));

  if (!activePath) return null;

  const effectiveSPW = getEffectiveSessionsPerWeek(path, activePath);
  const effectiveWeeks = getEffectiveWeeks(path, activePath);
  const currentWeek = Math.min(getCurrentWeek(activePath.startDate), effectiveWeeks);
  const weekPlan = path.weeklyPlan[Math.min(currentWeek - 1, path.weeklyPlan.length - 1)];
  const weekSessions = getWeekSessions(activePath.sessions, activePath.startDate, currentWeek);
  const totalSessions = activePath.sessions.length;
  const totalRequired = path.weeklyPlan.reduce((s, w) => s + w.sessions, 0);
  const overallProgress = Math.min(totalSessions / totalRequired, 1);
  const isComplete = currentWeek > effectiveWeeks || totalSessions >= totalRequired;

  const handleQuit = () => {
    Alert.alert('Quit this path?', 'Your progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Quit', style: 'destructive',
        onPress: async () => {
          await stopPath(pathId);
          navigation.navigate('Main');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#020B18', '#041428', '#020B18']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Main')}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>🏠 Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{path.icon} {path.title}</Text>
        {!isComplete && (
          <TouchableOpacity onPress={handleQuit}>
            <Text style={styles.quitText}>Quit</Text>
          </TouchableOpacity>
        )}
        {isComplete && <View style={{ minWidth: 40 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {isComplete ? (
          /* ── GOAL ACHIEVED ── */
          <View style={styles.completeSection}>
            <Text style={styles.completeTrophy}>🏆</Text>
            <Text style={styles.completeTitle}>Goal Achieved!</Text>
            <Text style={styles.completeSubtitle}>
              You completed the {path.title} path!{'\n'}
              {totalSessions} sessions · {effectiveWeeks} weeks
            </Text>

            {/* Share button */}
            <TouchableOpacity style={styles.sharePathBtn} onPress={handleShare} activeOpacity={0.8}>
              <Text style={styles.sharePathText}>↑ Share Achievement</Text>
            </TouchableOpacity>

            {/* Next challenge suggestions */}
            {(() => {
              // Check for next unlocked goal on the SAME path (e.g. 5K → 10K)
              const currentGoalId = activePath?.selectedGoalId;
              const completedKey = currentGoalId ? `${pathId}:${currentGoalId}` : pathId;
              const nextGoal = path.goalOptions?.find(g =>
                g.requiresGoalId === completedKey
              );

              const activeIds = new Set(allActivePaths.map(a => a.pathId));
              const otherPaths = ALL_PATHS
                .filter(p => p.id !== pathId && !activeIds.has(p.id))
                .slice(0, nextGoal ? 1 : 2); // make room for next goal card

              return (
                <View style={styles.nextSection}>
                  <Text style={styles.nextLabel}>What's next?</Text>

                  {/* Next level unlock — highlighted prominently */}
                  {nextGoal && (
                    <TouchableOpacity
                      style={[styles.nextUnlockCard, { borderColor: path.color }]}
                      onPress={() => navigation.navigate('PathDetail', { pathId, fromCompletion: true })}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.nextUnlockBadge}>🔓 UNLOCKED</Text>
                      <Text style={styles.nextUnlockIcon}>{path.icon}</Text>
                      <Text style={[styles.nextUnlockTitle, { color: path.color }]}>{nextGoal.label}</Text>
                      <Text style={styles.nextUnlockMeta}>{nextGoal.targetMi} miles — tap to start</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.nextRow}>
                    {otherPaths.map(s => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.nextCard, { borderColor: `${s.color}44` }]}
                        onPress={() => navigation.navigate('PathDetail', { pathId: s.id })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.nextIcon}>{s.icon}</Text>
                        <Text style={[styles.nextTitle, { color: s.color }]}>{s.title}</Text>
                        <Text style={styles.nextMeta}>{s.weeks}w · {s.workoutType}</Text>
                      </TouchableOpacity>
                    ))}
                    {/* Run Again — always show */}
                    <TouchableOpacity
                      style={[styles.nextCard, { borderColor: `${path.color}33` }]}
                      onPress={() => navigation.navigate('PathDetail', { pathId, fromCompletion: true })}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.nextIcon}>{path.icon}</Text>
                      <Text style={[styles.nextTitle, { color: path.color }]}>{currentGoalId ? path.goalOptions?.find(g => g.id === currentGoalId)?.label ?? path.title : path.title}</Text>
                      <Text style={styles.nextMeta}>🔁 Again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={async () => {
                await saveCompletedGoal(pathId, activePath?.selectedGoalId);
                await stopPath(pathId);
                navigation.navigate('Main');
              }}
            >
              <Text style={styles.doneBtnText}>Back to Home 🎉</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Overall progress */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.weekLabel}>Week {currentWeek} of {effectiveWeeks}{effectiveSPW !== path.weeklyPlan[0]?.sessions ? ` · ${effectiveSPW}x/wk` : ''}</Text>
                <Text style={styles.progressPct}>{Math.round(overallProgress * 100)}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={['#00BFFF', '#00E5CC', '#39FF14']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${overallProgress * 100}%` }]}
                />
              </View>
              <Text style={styles.progressSub}>
                {totalSessions} of {totalRequired} sessions complete
              </Text>
            </View>

            {/* This week */}
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={styles.weekCard}>
              <Text style={styles.weekDesc}>{weekPlan.description}</Text>
              <View style={styles.weekTargetRow}>
                <Text style={styles.weekTarget}>
                  {weekSessions.length} / {effectiveSPW} sessions done
                </Text>
                {weekPlan.targetMi && (
                  <Text style={styles.weekTargetDist}>🎯 {weekPlan.targetMi} mi goal</Text>
                )}
              </View>

              {/* Session dots */}
              <View style={styles.sessionDots}>
                {Array.from({ length: effectiveSPW }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.sessionDot,
                      i < weekSessions.length && styles.sessionDotDone,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Log session */}
            <TouchableOpacity
              style={styles.logBtn}
              onPress={() => navigation.navigate('LogWorkout', { pathWorkoutType: path.workoutType })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#00BFFF', '#00E5CC', '#39FF14']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.logBtnText}>+ Log {path.workoutType} Session</Text>
            </TouchableOpacity>

            {/* Recent sessions */}
            {activePath.sessions.length > 0 && (
              <>
                {/* Goal progression badges */}
                {path.goalOptions && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Goal Progress</Text>
                    <View style={styles.badgesGrid}>
                      {path.goalOptions.map(g => {
                        const completedKey = `${pathId}:${g.id}`;
                        const done = completedGoalsList.includes(completedKey) ||
                          (isComplete && activePath?.selectedGoalId === g.id);
                        const unlocked = isGoalUnlocked(g, completedGoalsList);
                        const isCurrent = activePath?.selectedGoalId === g.id;
                        return (
                          <View key={g.id} style={[
                            styles.badge,
                            done && styles.badgeDone,
                            isCurrent && !done && { borderColor: `${path.color}55`, backgroundColor: `${path.color}08` },
                          ]}>
                            <Text style={[styles.badgeEmoji, !unlocked && { opacity: 0.3 }]}>
                              {done ? '✅' : unlocked ? '🎯' : '🔒'}
                            </Text>
                            <Text style={[
                              styles.badgeTitle,
                              done && { color: path.color },
                              isCurrent && !done && { color: path.color, opacity: 0.8 },
                            ]}>{g.label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Path Achievements */}
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Milestones</Text>
                <View style={styles.badgesGrid}>
                  {path.milestones.map(m => {
                    const done = unlockedIds.includes(m.id);
                    return (
                      <View key={m.id} style={[styles.badge, done && styles.badgeDone]}>
                        <Text style={[styles.badgeEmoji, !done && { opacity: 0.3 }]}>{m.emoji}</Text>
                        <Text style={[styles.badgeTitle, done && { color: path.color }]}>{m.title}</Text>
                      </View>
                    );
                  })}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Recent Sessions</Text>
                {[...activePath.sessions].reverse().slice(0, 5).map((s, i) => (
                  <View key={i} style={styles.sessionRow}>
                    <Text style={styles.sessionDate}>{s.date}</Text>
                    <Text style={styles.sessionStats}>
                      {s.duration} min{s.distanceMi ? ` · ${s.distanceMi.toFixed(2)} mi` : ''}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Achievement celebration modal */}
      <Modal visible={!!newMilestone} transparent animationType="fade" onRequestClose={() => setNewMilestone(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setNewMilestone(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>{newMilestone?.emoji}</Text>
            <Text style={styles.modalUnlocked}>Achievement Unlocked!</Text>
            <Text style={styles.modalTitle}>{newMilestone?.title}</Text>
            <Text style={styles.modalDesc}>{newMilestone?.description}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setNewMilestone(null)}>
              <Text style={styles.modalBtnText}>Nice! 🎉</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Off-screen share card */}
      {activePath && (
        <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 1 }} style={styles.shareCard}>
          <View style={styles.shareCardBg}>
            <Text style={styles.shareCardApp}>42</Text>
            <Text style={styles.shareCardIcon}>{path.icon}</Text>
            <Text style={styles.shareCardUnlocked}>GOAL ACHIEVED</Text>
            <Text style={styles.shareCardTitle}>{path.title}</Text>
            <View style={styles.shareCardStats}>
              <View style={styles.shareCardStat}>
                <Text style={[styles.shareCardStatVal, { color: path.color }]}>{totalSessions}</Text>
                <Text style={styles.shareCardStatLabel}>Sessions</Text>
              </View>
              <View style={styles.shareCardDivider} />
              <View style={styles.shareCardStat}>
                <Text style={[styles.shareCardStatVal, { color: path.color }]}>{effectiveWeeks}</Text>
                <Text style={styles.shareCardStatLabel}>Weeks</Text>
              </View>
              <View style={styles.shareCardDivider} />
              <View style={styles.shareCardStat}>
                <Text style={[styles.shareCardStatVal, { color: path.color }]}>{unlockedIds.length}</Text>
                <Text style={styles.shareCardStatLabel}>Badges</Text>
              </View>
            </View>
            <Text style={styles.shareCardTag}>#42DayChallenge</Text>
          </View>
        </ViewShot>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020B18' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { minWidth: 60 },
  backText: { color: '#00E5CC', fontSize: 17 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  quitText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, minWidth: 40, textAlign: 'right' },
  scroll: { paddingHorizontal: 24 },

  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 24,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  weekLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  progressPct: { fontSize: 16, fontWeight: '800', color: '#00E5CC' },
  progressBarBg: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4, overflow: 'hidden', marginBottom: 10,
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12,
  },

  weekCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 20,
  },
  weekDesc: { fontSize: 15, color: '#fff', fontWeight: '600', marginBottom: 8 },
  weekTargetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  weekTarget: { fontSize: 13, color: '#00E5CC', fontWeight: '600' },
  weekTargetDist: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  sessionDots: { flexDirection: 'row', gap: 8 },
  sessionDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  sessionDotDone: {
    backgroundColor: 'rgba(0,229,204,0.2)',
    borderColor: '#00E5CC',
  },

  logBtn: {
    borderRadius: 16, overflow: 'hidden',
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#00E5CC', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
  },
  logBtnText: { color: '#020B18', fontSize: 16, fontWeight: '800' },

  sessionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sessionDate: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  sessionStats: { fontSize: 14, color: '#00E5CC', fontWeight: '600' },

  completeSection: { alignItems: 'center', paddingTop: 40 },
  completeTrophy: { fontSize: 80, marginBottom: 20 },
  completeTitle: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 12 },
  completeSubtitle: {
    fontSize: 16, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 26, marginBottom: 36,
  },
  doneBtn: {
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,229,204,0.15)', borderWidth: 1, borderColor: '#00E5CC',
  },
  doneBtnText: { color: '#00E5CC', fontSize: 17, fontWeight: '700' },

  // Path achievement badges
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  badge: {
    width: '30%', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 4,
  },
  badgeDone: { backgroundColor: 'rgba(0,229,204,0.08)', borderColor: 'rgba(0,229,204,0.3)' },
  badgeEmoji: { fontSize: 22 },
  badgeTitle: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 14 },

  // Celebration modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%', backgroundColor: '#041428', borderRadius: 28,
    padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,229,204,0.3)',
  },
  modalEmoji: { fontSize: 64, marginBottom: 12 },
  modalUnlocked: { fontSize: 12, fontWeight: '700', color: '#00E5CC', letterSpacing: 2, marginBottom: 8 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 24 },
  modalBtn: {
    paddingVertical: 12, paddingHorizontal: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,229,204,0.12)', borderWidth: 1, borderColor: '#00E5CC',
  },
  modalBtnText: { color: '#00E5CC', fontSize: 16, fontWeight: '700' },

  // Next challenge
  nextSection: { width: '100%', marginBottom: 16, marginTop: 4 },
  nextUnlockCard: {
    width: '100%', alignItems: 'center', paddingVertical: 20,
    borderRadius: 18, borderWidth: 2,
    backgroundColor: 'rgba(0,229,204,0.06)', marginBottom: 12, gap: 4,
  },
  nextUnlockBadge: { fontSize: 11, fontWeight: '800', color: '#39FF14', letterSpacing: 2 },
  nextUnlockIcon: { fontSize: 36 },
  nextUnlockTitle: { fontSize: 22, fontWeight: '900' },
  nextUnlockMeta: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  nextLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 },
  nextRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  nextCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, gap: 4,
  },
  nextIcon: { fontSize: 28 },
  nextTitle: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  nextMeta: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },

  // Share button
  sharePathBtn: {
    paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(0,229,204,0.35)',
    backgroundColor: 'rgba(0,229,204,0.1)', marginBottom: 12,
  },
  sharePathText: { color: '#00E5CC', fontSize: 15, fontWeight: '700' },

  // Off-screen share card
  shareCard: { position: 'absolute', left: -9999, top: 0, width: 400 },
  shareCardBg: {
    backgroundColor: '#020B18', padding: 36, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,229,204,0.2)',
  },
  shareCardApp: { fontSize: 28, fontWeight: '900', color: '#00E5CC', letterSpacing: 4, marginBottom: 8 },
  shareCardIcon: { fontSize: 56, marginBottom: 8 },
  shareCardUnlocked: { fontSize: 11, fontWeight: '700', color: '#00E5CC', letterSpacing: 2, marginBottom: 6 },
  shareCardTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 24, textAlign: 'center' },
  shareCardStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  shareCardStat: { alignItems: 'center', paddingHorizontal: 24 },
  shareCardStatVal: { fontSize: 32, fontWeight: '900' },
  shareCardStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  shareCardDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  shareCardTag: { fontSize: 13, color: 'rgba(0,229,204,0.6)', letterSpacing: 1 },
});
