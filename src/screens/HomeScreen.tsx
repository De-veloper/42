import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Modal,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import ViewShot, { ViewShotRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, TabParamList } from "../../App";
import CircularProgress from "../components/CircularProgress";
import GaugeRing from "../components/GaugeRing";
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  getSavedReminderTime,
  saveReminderTime,
  sendTestNotification,
  cancelReminders,
  DEFAULT_HOUR,
} from "../utils/notifications";
import {
  ALL_MILESTONES,
  Milestone,
  getUnlockedIds,
  getSeenMilestones,
  markMilestonesSeen,
  resetMilestones,
} from "../utils/milestones";
import {
  loadData,
  loadWorkouts,
  loadRestDays,
  toggleRestDay,
  todayString,
  saveStartDate,
  saveProgramStarted,
  getDayNumber,
  resetAll,
  formatMins,
  getToday,
  AppData,
  WorkoutEntry,
} from "../utils/storage";
import {
  computeFitnessScore,
  FEELING_LABELS,
  WORKOUT_TYPES,
} from "../utils/fitnessScore";
import {
  loadActivePaths,
  ALL_PATHS,
  ActivePath,
  clearActivePath,
} from "../utils/paths";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isReady, autoImportFromHealth, fetchDailySteps } from "../utils/healthKit";

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, "Home">,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

export default function HomeScreen({ navigation }: Props) {
  const [data, setData] = useState<AppData>({
    startDate: null,
    completedDays: [],
    programStarted: false,
  });
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [reminderHour, setReminderHour] = useState(DEFAULT_HOUR);
  const [newMilestone, setNewMilestone] = useState<Milestone | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [restDays, setRestDays] = useState<string[]>([]);
  const [activePaths, setActivePaths] = useState<ActivePath[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [steps, setSteps] = useState(0);
  const shareCardRef = useRef<ViewShotRef>(null);

  useEffect(() => {
    getSavedReminderTime().then(({ hour }) => setReminderHour(hour));
  }, []);

  const handleSyncHealth = async () => {
    if (!isReady()) {
      Alert.alert('Health not ready', 'HealthKit is not initialized. Check Health permissions in Settings.');
      return;
    }
    setSyncing(true);
    const result = await autoImportFromHealth();
    setSyncing(false);
    if (result.imported > 0) {
      const wks = await loadWorkouts();
      setWorkouts(wks);
      Alert.alert('Synced', `${result.imported} workout${result.imported > 1 ? 's' : ''} imported from Apple Health.`);
    } else {
      const details = [
        `Found ${result.found} in Health`,
        result.skippedAlreadyImported ? `${result.skippedAlreadyImported} already imported` : '',
        result.skippedDuplicate ? `${result.skippedDuplicate} duplicate` : '',
        result.skippedShort ? `${result.skippedShort} too short` : '',
      ].filter(Boolean).join('\n');
      Alert.alert('No new workouts', details || 'No workouts found in Apple Health.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [appData, wks, rds, aps, name] = await Promise.all([
          loadData(),
          loadWorkouts(),
          loadRestDays(),
          loadActivePaths(),
          AsyncStorage.getItem("@42_user_name"),
        ]);
        setData(appData);
        setWorkouts(wks);
        setRestDays(rds);
        setActivePaths(aps);
        setUserName(name);
        // Auto-sync from HealthKit on focus
        if (appData.programStarted && isReady()) {
          const result = await autoImportFromHealth();
          if (result.imported > 0) {
            const updated = await loadWorkouts();
            setWorkouts(updated);
          }
          fetchDailySteps(todayString()).then(setSteps);
        }
      })();
    }, []),
  );

  const startProgram = async () => {

    const today = todayString();

    await saveStartDate(today);
    await saveProgramStarted(true);
    setData((prev) => ({ ...prev, startDate: today, programStarted: true }));
    const granted = await requestNotificationPermission();
    if (granted) await scheduleDailyReminder(reminderHour, 0);
  };

  const handleToggleRestDay = async () => {
    const today = todayString();
    const updated = await toggleRestDay(today);
    setRestDays(updated);
  };

  const handleChangeReminder = async (hour: number) => {
    setReminderHour(hour);
    await saveReminderTime(hour, 0);
    if (data.programStarted) await scheduleDailyReminder(hour, 0);
  };

  const currentDay = data.startDate ? getDayNumber(data.startDate) : 0;
  const completedCount = new Set(workouts.map((w) => w.dayNumber)).size;
  const daysRemaining = Math.max(42 - currentDay, 0);
  const progress = daysRemaining === 0 ? 1 : completedCount / 42;
  const score = computeFitnessScore(
    workouts,
    data.startDate ?? "",
    currentDay,
    restDays,
  );
  const todayWorkouts = workouts.filter((w) => w.dayNumber === currentDay);
  const lastWorkout = workouts[0] ?? null;
  const isFinished = daysRemaining === 0;
  const isRestDay = restDays.includes(todayString());

  // Weekly summary
  const weekNum = Math.ceil(Math.min(currentDay, 42) / 7);
  const weekStart = (weekNum - 1) * 7 + 1;
  const weekEnd = Math.min(weekNum * 7, 42);
  const prevWeekStart = (weekNum - 2) * 7 + 1;
  const prevWeekEnd = weekStart - 1;
  const thisWeekWorkouts = workouts.filter(
    (w) => w.dayNumber >= weekStart && w.dayNumber <= weekEnd,
  );
  const prevWeekWorkouts = workouts.filter(
    (w) => w.dayNumber >= prevWeekStart && w.dayNumber <= prevWeekEnd,
  );
  const weekDaysActive = new Set(thisWeekWorkouts.map((w) => w.dayNumber)).size;
  const weekTotalMins = thisWeekWorkouts.reduce((s, w) => s + w.duration, 0);
  const prevScore =
    prevWeekWorkouts.length > 0
      ? computeFitnessScore(
          workouts.filter((w) => w.dayNumber <= prevWeekEnd),
          data.startDate ?? "",
          prevWeekEnd,
          restDays,
        ).total
      : 0;
  const scoreChange = score.total - prevScore;

  // Check for newly unlocked milestones
  useEffect(() => {
    if (!data.programStarted || workouts.length === 0) return;
    (async () => {
      const unlocked = getUnlockedIds(workouts, currentDay, score);
      setUnlockedIds(unlocked);
      const seen = await getSeenMilestones();
      const newlyUnlocked = unlocked.filter((id) => !seen.includes(id));
      if (newlyUnlocked.length > 0) {
        const milestone = ALL_MILESTONES.find(
          (m) => m.id === newlyUnlocked[0],
        )!;
        setNewMilestone(milestone);
        await markMilestonesSeen(newlyUnlocked);
      }
    })();
  }, [workouts, currentDay, score.streak]);

  const handleShare = async () => {
    try {
      const tempUri = await shareCardRef.current!.capture();
      const destUri = FileSystem.documentDirectory + "share-card.png";
      await FileSystem.copyAsync({ from: tempUri, to: destUri });
      await Sharing.shareAsync(destUri, {
        mimeType: "image/png",
        dialogTitle: "Share your progress",
      });
    } catch {
      Alert.alert("Could not share", "Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#020B18", "#041428", "#020B18"]}
        style={styles.bg}
      />
      <View style={styles.glowTop} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>42</Text>
            {userName && (
              <Text style={styles.headerGreeting} numberOfLines={1}>
                {(() => {
                  const n = userName.split(" ")[0];
                  return `Hi ${n.length > 14 ? n.slice(0, 14) + "…" : n} 👋`;
                })()}
              </Text>
            )}
            <Text style={styles.headerDate}>

              {getToday().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}

            </Text>
          </View>
          <View style={styles.headerActions}>
            {data.programStarted && isReady() && (
              <TouchableOpacity onPress={handleSyncHealth} style={styles.syncBtn} disabled={syncing} activeOpacity={0.75}>
                <Text style={styles.syncBtnText}>{syncing ? '⏳' : '❤️‍🩹'}</Text>
              </TouchableOpacity>
            )}
            {data.programStarted && (
              <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>↑ Share</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => navigation.navigate("Settings")}
              style={styles.bellBtn}
            >
              <Text style={styles.bellBtnText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!data.programStarted ? (
          /* ── NOT STARTED ── */
          <View style={styles.startContainer}>
            <CircularProgress progress={0} currentDay={0} />
            <Text style={styles.readyText}>Ready to Transform?</Text>
            <Text style={styles.readySubtext}>
              Commit to 42 days. Log every session.{"\n"}Watch your fitness
              score climb.
            </Text>

            {/* Reminder time picker */}
            <View style={styles.reminderRow}>
              <View style={styles.reminderLabelRow}>
                <Text style={styles.reminderLabel}>🔔 Daily reminder</Text>
                <TouchableOpacity
                  onPress={async () => {
                    await requestNotificationPermission();
                    await sendTestNotification();
                    Alert.alert(
                      "Test sent",
                      "You'll see a notification in 5 seconds — background the app first.",
                    );
                  }}
                >
                  <Text style={styles.reminderTestBtn}>Test</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.reminderPills}>
                {[7, 12, 18, 20].map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.reminderPill,
                      reminderHour === h && styles.reminderPillActive,
                    ]}
                    onPress={() => handleChangeReminder(h)}
                  >
                    <Text
                      style={[
                        styles.reminderPillText,
                        reminderHour === h && styles.reminderPillTextActive,
                      ]}
                    >
                      {h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtnWrapper}
              onPress={startProgram}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#00BFFF", "#00E5CC", "#39FF14"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.primaryBtnText}>Begin Today</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── PROGRAM ACTIVE ── */
          <>
            {/* Progress ring */}
            <View style={styles.ringSection}>
              <CircularProgress progress={progress} currentDay={currentDay} />
            </View>

            {/* Days remaining + fitness score gauges */}
            <View style={styles.heroRow}>
              <GaugeRing
                value={daysRemaining}
                label="Days Left"
                sub={`Day ${currentDay} / 42`}
                progress={daysRemaining / 42}
                gradientColors={["#00BFFF", "#00E5CC"]}
              />
              <GaugeRing
                value={score.total}
                label="Fitness Score"
                sub={score.level}
                progress={score.total / 100}
                color={score.levelColor}
              />
            </View>

            {/* Weekly summary card */}
            {data.programStarted && weekNum >= 1 && (
              <View style={styles.weekCard}>
                <View style={styles.weekCardHeader}>
                  <Text style={styles.weekCardTitle}>
                    Week {weekNum} <Text style={styles.weekCardOf}>of 6</Text>
                  </Text>
                  <Text style={styles.weekCardDays}>
                    Days {weekStart}–{weekEnd}
                  </Text>
                </View>

                {/* Day dots */}
                <View style={styles.weekDots}>
                  {Array.from({ length: weekEnd - weekStart + 1 }, (_, i) => {
                    const day = weekStart + i;
                    const hasWorkout = workouts.some(
                      (w) => w.dayNumber === day,
                    );
                    const isRest = restDays.some((d) => {
                      const start = new Date(data.startDate!);
                      start.setHours(0, 0, 0, 0);
                      const target = new Date(
                        start.getTime() + (day - 1) * 86400000,
                      );
                      const y = target.getFullYear();
                      const m = String(target.getMonth() + 1).padStart(2, "0");
                      const dd = String(target.getDate()).padStart(2, "0");
                      return d === `${y}-${m}-${dd}`;
                    });
                    const isFuture = day > currentDay;
                    return (
                      <View
                        key={day}
                        style={[
                          styles.weekDot,
                          hasWorkout && styles.weekDotActive,
                          isRest && styles.weekDotRest,
                          isFuture && styles.weekDotFuture,
                        ]}
                      >
                        <Text style={styles.weekDotLabel}>{day}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Stats row */}
                <View style={styles.weekStats}>
                  <View style={styles.weekStat}>
                    <Text style={styles.weekStatValue}>
                      {weekDaysActive}
                      <Text style={styles.weekStatOf}>/7</Text>
                    </Text>
                    <Text style={styles.weekStatLabel}>Days active</Text>
                  </View>
                  <View style={styles.weekStatDivider} />
                  <View style={styles.weekStat}>
                    <Text style={styles.weekStatValue}>
                      {formatMins(weekTotalMins)}
                    </Text>
                    <Text style={styles.weekStatLabel}>This week</Text>
                  </View>
                  <View style={styles.weekStatDivider} />
                  <View style={styles.weekStat}>
                    <Text
                      style={[
                        styles.weekStatValue,
                        { color: scoreChange >= 0 ? "#39FF14" : "#EF4444" },
                      ]}
                    >
                      {scoreChange >= 0 ? "+" : ""}
                      {scoreChange}
                    </Text>
                    <Text style={styles.weekStatLabel}>Score change</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Streak badge */}
            {score.streak > 1 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>
                  🔥 {score.streak}-day streak — keep it going!
                </Text>
              </View>
            )}

            {/* Add another path — visible when finished and paths are active */}
            {isFinished && activePaths.length > 0 && (
              <TouchableOpacity
                style={styles.addPathBtn}
                onPress={() =>
                  navigation.navigate("Complete", {
                    score: {
                      total: score.total,
                      level: score.level,
                      levelColor: score.levelColor,
                    },
                    totalWorkouts: workouts.length,
                    totalMinutes: score.totalMinutes,
                    streak: score.streak,
                  })
                }
                activeOpacity={0.8}
              >
                <Text style={styles.addPathBtnText}>
                  ＋ Add another Journey Path
                </Text>
              </TouchableOpacity>
            )}

            {/* Active Journey Path banners */}
            {activePaths.map((ap) => {
              const p = ALL_PATHS.find((x) => x.id === ap.pathId);
              if (!p) return null;
              return (
                <TouchableOpacity
                  key={ap.pathId}
                  style={styles.pathBanner}
                  onPress={() =>
                    navigation.navigate("PathProgress", { pathId: ap.pathId })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.pathBannerIcon}>{p.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pathBannerTitle}>
                      Journey: {p.title}
                    </Text>
                    <Text style={styles.pathBannerSub}>
                      {ap.sessions.length} sessions · Tap to view progress
                    </Text>
                  </View>
                  <Text style={styles.pathBannerArrow}>›</Text>
                </TouchableOpacity>
              );
            })}

            {/* Completion banner */}
            {isFinished && activePaths.length === 0 && (
              <View style={styles.completedBanner}>
                <Text style={styles.completedEmoji}>🏆</Text>
                <Text style={styles.completedTitle}>42 Days Complete!</Text>
                <Text style={styles.completedSub}>
                  Final score: {score.total} · {score.level}
                </Text>
                <TouchableOpacity
                  style={styles.seeResultsBtn}
                  onPress={() =>
                    navigation.navigate("Complete", {
                      score: {
                        total: score.total,
                        level: score.level,
                        levelColor: score.levelColor,
                      },
                      totalWorkouts: workouts.length,
                      totalMinutes: score.totalMinutes,
                      streak: score.streak,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.seeResultsText}>See Your Results →</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.startAgainBtn}
                  onPress={() =>
                    Alert.alert(
                      "Start a New Challenge?",
                      "This resets all workouts and progress. Your journey paths will continue.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Start Fresh",
                          style: "destructive",
                          onPress: async () => {
                            await resetAll();
                            await cancelReminders();
                            await resetMilestones();
                            await clearActivePath();
                            (navigation as any).reset({
                              index: 0,
                              routes: [{ name: "Welcome" }],
                            });
                          },
                        },
                      ],
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.startAgainText}>
                    ↺ Start a New 42-Day Challenge
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Today's log CTA */}
            {!isFinished && activePaths.length === 0 && (
              <View style={styles.todaySection}>
                <View style={styles.todayHeader}>
                  <Text style={styles.sectionTitle}>
                    Today — Day {currentDay}
                  </Text>
                  {todayWorkouts.length > 0 && (
                    <Text style={styles.todayCount}>
                      {todayWorkouts.length} logged
                    </Text>
                  )}
                </View>

                {steps > 0 && (
                  <View style={styles.stepsRow}>
                    <Text style={styles.stepsIcon}>👟</Text>
                    <Text style={styles.stepsValue}>{steps.toLocaleString()}</Text>
                    <Text style={styles.stepsLabel}>steps today</Text>
                  </View>
                )}

                {isRestDay ? (
                  /* ── REST DAY ── */
                  <TouchableOpacity
                    style={styles.restDayCard}
                    onPress={handleToggleRestDay}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.restDayEmoji}>😴</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.restDayTitle}>Rest Day</Text>
                      <Text style={styles.restDaySubtitle}>
                        Recovery is part of the plan. Tap to undo.
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : todayWorkouts.length === 0 ? (
                  /* ── NO WORKOUT YET ── */
                  <>
                    <TouchableOpacity
                      style={styles.primaryBtnWrapper}
                      onPress={() => navigation.navigate("LogWorkout")}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={["#00BFFF", "#00E5CC", "#39FF14"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <Text style={styles.primaryBtnText}>
                        + Log Today's Workout
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.restDayBtn}
                      onPress={handleToggleRestDay}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.restDayBtnText}>
                        😴 Mark as Rest Day
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* ── WORKOUTS LOGGED ── */
                  <>
                    {todayWorkouts.map((w) => (
                      <TodayWorkoutRow key={w.id} workout={w} onPress={() => navigation.navigate('LogWorkout', { workout: w })} />
                    ))}
                    <TouchableOpacity
                      style={styles.addMoreBtn}
                      onPress={() => navigation.navigate("LogWorkout")}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.addMoreText}>
                        + Add another session
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Score breakdown mini */}
            {workouts.length > 0 && (
              <View style={styles.scoreCard}>
                <Text style={styles.sectionTitle}>Progress Breakdown</Text>
                {(
                  [
                    {
                      label: "Consistency",
                      value: score.consistency,
                      hint: `${new Set(workouts.map((w) => w.date)).size} active days`,
                    },
                    {
                      label: "Effort",
                      value: score.effort,
                      hint: `avg ${score.avgFeeling}/5 feeling`,
                    },
                    {
                      label: "Volume",
                      value: score.volume,
                      hint: `avg ${formatMins(score.avgDuration)}`,
                    },
                  ] as const
                ).map((row) => (
                  <View key={row.label} style={styles.scoreRow}>
                    <View style={styles.scoreRowMeta}>
                      <Text style={styles.scoreRowLabel}>{row.label}</Text>
                      <Text style={styles.scoreRowHint}>{row.hint}</Text>
                    </View>
                    <View style={styles.scoreBarOuter}>
                      <LinearGradient
                        colors={["#00BFFF", "#39FF14"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.scoreBarInner,
                          { width: `${row.value}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.scoreValue}>{row.value}</Text>
                  </View>
                ))}

                <View style={styles.totalScoreRow}>
                  <Text style={styles.totalScoreLabel}>Total score</Text>
                  <Text
                    style={[
                      styles.totalScoreValue,
                      { color: score.levelColor },
                    ]}
                  >
                    {score.total} / 100
                  </Text>
                </View>
              </View>
            )}

            {/* Milestone badges */}
            <View style={styles.badgesSection}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <View style={styles.badgesGrid}>
                {ALL_MILESTONES.map((m) => {
                  const unlocked = unlockedIds.includes(m.id);
                  return (
                    <View
                      key={m.id}
                      style={[
                        styles.badgePill,
                        unlocked && styles.badgePillUnlocked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeEmoji,
                          !unlocked && { opacity: 0.3 },
                        ]}
                      >
                        {m.emoji}
                      </Text>
                      <Text
                        style={[
                          styles.badgeLabel,
                          unlocked && styles.badgeLabelUnlocked,
                        ]}
                      >
                        {m.title}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Last workout preview */}
            {lastWorkout && lastWorkout.dayNumber !== currentDay && (
              <View style={styles.lastWorkoutCard}>
                <Text style={styles.sectionTitle}>Last Workout</Text>
                <LastWorkoutRow workout={lastWorkout} />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Milestone celebration modal */}
      <Modal
        visible={!!newMilestone}
        transparent
        animationType="fade"
        onRequestClose={() => setNewMilestone(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNewMilestone(null)}
        >
          <View style={styles.milestoneCard}>
            <Text style={styles.milestoneEmoji}>{newMilestone?.emoji}</Text>
            <Text style={styles.milestoneUnlocked}>Achievement Unlocked!</Text>
            <Text style={styles.milestoneTitle}>{newMilestone?.title}</Text>
            <Text style={styles.milestoneDesc}>
              {newMilestone?.description}
            </Text>
            <TouchableOpacity
              style={styles.milestoneDismiss}
              onPress={() => setNewMilestone(null)}
            >
              <Text style={styles.milestoneDismissText}>Nice! 🎉</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Off-screen share card — captured by ViewShot */}
      <ViewShot
        ref={shareCardRef}
        options={{ format: "png", quality: 1 }}
        style={styles.shareCard}
      >
        <View style={styles.shareCardBg}>
          <Text style={styles.shareCardApp}>42</Text>
          <Text style={styles.shareCardDay}>Day {currentDay} of 42</Text>
          <View style={styles.shareCardRow}>
            <View style={styles.shareCardStat}>
              <Text style={styles.shareCardStatValue}>{score.total}</Text>
              <Text style={styles.shareCardStatLabel}>Fitness Score</Text>
            </View>
            <View style={styles.shareCardDivider} />
            <View style={styles.shareCardStat}>
              <Text
                style={[styles.shareCardStatValue, { color: score.levelColor }]}
              >
                {score.level}
              </Text>
              <Text style={styles.shareCardStatLabel}>Level</Text>
            </View>
            <View style={styles.shareCardDivider} />
            <View style={styles.shareCardStat}>
              <Text style={styles.shareCardStatValue}>{daysRemaining}</Text>
              <Text style={styles.shareCardStatLabel}>Days Left</Text>
            </View>
          </View>
          <Text style={styles.shareCardTag}>#42DayChallenge</Text>
        </View>
      </ViewShot>
    </View>
  );
}

function TodayWorkoutRow({ workout, onPress }: { workout: WorkoutEntry; onPress: () => void }) {
  const icon =
    WORKOUT_TYPES.find((t) => t.label === workout.type)?.icon ?? "⚡";
  const feeling = FEELING_LABELS[workout.feeling];
  const timeStr = workout.timestamp
    ? new Date(workout.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : null;
  return (
    <TouchableOpacity style={styles.todayRow} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.todayRowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.todayRowType}>
          {workout.type}{" "}
          <Text style={styles.todayRowDuration}>{workout.duration} min</Text>
        </Text>
        {timeStr && (
          <Text style={styles.todayRowTime}>{timeStr}</Text>
        )}
        {workout.notes ? (
          <Text style={styles.todayRowNotes} numberOfLines={1}>
            {workout.notes}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.todayRowFeeling, { color: feeling.color }]}>
        {feeling.emoji}
      </Text>
    </TouchableOpacity>
  );
}

function LastWorkoutRow({ workout }: { workout: WorkoutEntry }) {
  const icon =
    WORKOUT_TYPES.find((t) => t.label === workout.type)?.icon ?? "⚡";
  const feeling = FEELING_LABELS[workout.feeling];
  return (
    <View style={styles.todayRow}>
      <Text style={styles.todayRowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.todayRowType}>
          {workout.type}{" "}
          <Text style={styles.todayRowDuration}>{workout.duration} min</Text>
        </Text>
        <Text style={styles.dayBadgeText}>Day {workout.dayNumber}</Text>
      </View>
      <Text style={[styles.todayRowFeeling, { color: feeling.color }]}>
        {feeling.emoji} {feeling.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020B18" },
  bg: { ...StyleSheet.absoluteFill },
  glowTop: {
    position: "absolute",
    top: -120,
    left: "50%",
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#00BFFF",
    opacity: 0.07,
  },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#00E5CC",
    letterSpacing: 2,
  },
  headerGreeting: {
    fontSize: 13,
    color: "#00E5CC",
    fontWeight: "600",
    marginTop: -2,
  },
  headerDate: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  resetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  resetText: { color: "rgba(255,255,255,0.35)", fontSize: 13 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  shareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.4)",
    backgroundColor: "rgba(0,229,204,0.08)",
  },
  shareBtnText: { color: "#00E5CC", fontSize: 13, fontWeight: "700" },
  syncBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
    backgroundColor: "rgba(255,59,48,0.08)",
  },
  syncBtnText: { fontSize: 16 },

  // Share card (off-screen, captured by ViewShot)
  shareCard: { position: "absolute", left: -9999, top: 0, width: 400 },
  shareCardBg: {
    backgroundColor: "#020B18",
    padding: 36,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.2)",
  },
  shareCardApp: {
    fontSize: 52,
    fontWeight: "900",
    color: "#00E5CC",
    letterSpacing: 4,
    marginBottom: 4,
  },
  shareCardDay: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 28,
    letterSpacing: 1,
  },
  shareCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    marginBottom: 28,
  },
  shareCardStat: { alignItems: "center", paddingHorizontal: 24 },
  shareCardStatValue: { fontSize: 28, fontWeight: "900", color: "#00BFFF" },
  shareCardStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  shareCardDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  shareCardTag: {
    fontSize: 13,
    color: "rgba(0,229,204,0.6)",
    letterSpacing: 1,
  },

  // Reminder time picker
  reminderRow: {
    width: "100%",
    marginBottom: 24,
  },
  reminderLabelRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  reminderTestBtn: {
    color: "#00E5CC",
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.7,
  },
  reminderLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  reminderPills: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  reminderPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  reminderPillActive: {
    backgroundColor: "rgba(0,229,204,0.15)",
    borderColor: "#00E5CC",
  },
  reminderPillText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "600",
  },
  reminderPillTextActive: { color: "#00E5CC" },

  // Bell button
  bellBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  bellBtnText: { fontSize: 16 },

  // Reminder modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#041428",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.2)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 24,
  },
  modalTestBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.3)",
  },
  modalTestBtnText: { color: "#00E5CC", fontSize: 13, fontWeight: "600" },

  // Milestone celebration modal
  milestoneCard: {
    width: "85%",
    backgroundColor: "#041428",
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.3)",
  },
  milestoneEmoji: { fontSize: 64, marginBottom: 12 },
  milestoneUnlocked: {
    fontSize: 12,
    fontWeight: "700",
    color: "#00E5CC",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  milestoneDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: 24,
  },
  milestoneDismiss: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,229,204,0.12)",
    borderWidth: 1,
    borderColor: "#00E5CC",
  },
  milestoneDismissText: { color: "#00E5CC", fontSize: 16, fontWeight: "700" },

  // Rest day
  restDayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
  },
  restDayEmoji: { fontSize: 28 },
  restDayTitle: { fontSize: 15, fontWeight: "700", color: "#C4B5FD" },
  restDaySubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  restDayBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
    borderStyle: "dashed",
  },
  restDayBtnText: {
    color: "rgba(196,181,253,0.7)",
    fontSize: 14,
    fontWeight: "600",
  },

  // Weekly summary card
  weekCard: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.15)",
  },
  weekCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  weekCardTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  weekCardOf: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.35)",
  },
  weekCardDays: { fontSize: 12, color: "rgba(255,255,255,0.35)" },

  weekDots: { flexDirection: "row", gap: 6, marginBottom: 16 },
  weekDot: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  weekDotActive: {
    backgroundColor: "rgba(0,229,204,0.2)",
    borderColor: "#00E5CC",
  },
  weekDotRest: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderColor: "#8B5CF6",
  },
  weekDotFuture: { opacity: 0.3 },
  weekDotLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },

  weekStats: { flexDirection: "row", alignItems: "center" },
  weekStat: { flex: 1, alignItems: "center" },
  weekStatValue: { fontSize: 16, fontWeight: "900", color: "#00E5CC" },
  weekStatOf: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.35)",
  },
  weekStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  weekStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  // Milestone badges grid
  badgesSection: { paddingHorizontal: 24, marginTop: 24 },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  badgePillUnlocked: {
    backgroundColor: "rgba(0,229,204,0.1)",
    borderColor: "rgba(0,229,204,0.35)",
  },
  badgeEmoji: { fontSize: 16 },
  badgeLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "600",
  },
  badgeLabelUnlocked: { color: "#00E5CC" },

  // Start state
  startContainer: {
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 32,
  },
  readyText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginTop: 32,
    textAlign: "center",
  },
  readySubtext: {
    fontSize: 15,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 36,
  },

  // Primary button
  primaryBtnWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00E5CC",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryBtnText: { color: "#020B18", fontSize: 17, fontWeight: "800" },

  // Ring
  ringSection: { alignItems: "center", paddingTop: 0, paddingBottom: 0 },

  // Hero cards
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 24,
    marginTop: 8,
  },
  heroCard: {
    flex: 1,
    borderRadius: 18,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,191,255,0.2)",
  },
  heroCardBorderBlue: { borderColor: "rgba(0,191,255,0.3)" },
  heroValue: { fontSize: 38, fontWeight: "900", color: "#00BFFF" },
  heroLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  heroSub: { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 },

  // Streak
  streakBadge: {
    marginHorizontal: 24,
    marginTop: 14,
    backgroundColor: "rgba(255,160,0,0.12)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,160,0,0.25)",
  },
  streakText: { color: "#FFA500", fontSize: 13, fontWeight: "600" },

  // Completed banner
  completedBanner: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: "rgba(0,229,204,0.08)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.25)",
  },
  completedEmoji: { fontSize: 36 },
  completedTitle: {
    color: "#00E5CC",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 8,
  },
  completedSub: { color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 4 },
  seeResultsBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.4)",
    backgroundColor: "rgba(0,229,204,0.1)",
  },
  seeResultsText: { color: "#00E5CC", fontSize: 15, fontWeight: "700" },
  startAgainBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  startAgainText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "600",
  },
  addPathBtn: {
    marginHorizontal: 24,
    marginTop: 10,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(0,229,204,0.3)",
  },
  addPathBtnText: {
    color: "rgba(0,229,204,0.7)",
    fontSize: 14,
    fontWeight: "600",
  },

  // Journey Path banner
  pathBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 24,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(0,191,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,191,255,0.25)",
  },
  pathBannerIcon: { fontSize: 24 },
  pathBannerTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  pathBannerSub: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  pathBannerArrow: {
    fontSize: 20,
    color: "rgba(0,191,255,0.6)",
    fontWeight: "700",
  },

  // Today section
  todaySection: { paddingHorizontal: 24, marginTop: 24 },
  todayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  todayCount: { color: "#00E5CC", fontSize: 13, fontWeight: "600" },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stepsIcon: { fontSize: 16 },
  stepsValue: { color: "#00E5CC", fontSize: 18, fontWeight: "800" },
  stepsLabel: { color: "rgba(255,255,255,0.4)", fontSize: 13 },

  todayRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  todayRowIcon: { fontSize: 22 },
  todayRowType: { fontSize: 15, fontWeight: "700", color: "#fff" },
  todayRowDuration: { color: "#00E5CC", fontWeight: "700" },
  todayRowTime: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 1 },
  todayRowNotes: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 },
  todayRowFeeling: { fontSize: 14, fontWeight: "600" },
  dayBadgeText: {
    color: "#00BFFF",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  addMoreBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.25)",
    borderStyle: "dashed",
  },
  addMoreText: { color: "#00E5CC", fontSize: 14, fontWeight: "600" },

  // Score card
  scoreCard: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  scoreRowMeta: { width: 100 },
  scoreRowLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  scoreRowHint: { color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 1 },
  scoreBarOuter: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  scoreBarInner: { height: "100%", borderRadius: 3 },
  scoreValue: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    minWidth: 30,
    textAlign: "right",
  },
  totalScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    marginTop: 4,
  },
  totalScoreLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },
  totalScoreValue: { fontSize: 16, fontWeight: "800" },

  // Last workout
  lastWorkoutCard: {
    marginHorizontal: 24,
    marginTop: 20,
  },

  sectionTitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
});
