import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  Modal,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import LinearGradient from "react-native-linear-gradient";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp } from "@react-navigation/native";
import { RootStackParamList, TabParamList } from "../../App";
import {
  loadWorkouts,
  loadData,
  loadRestDays,
  deleteWorkout,
  getDayNumber,
  formatDate,
  formatMins,
  WorkoutEntry,
} from "../utils/storage";
import {
  computeFitnessScore,
  computeScoreHistory,
  FEELING_LABELS,
  WORKOUT_TYPES,
} from "../utils/fitnessScore";
import ProgressChart from "../components/ProgressChart";

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, "History">,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

interface Section {
  title: string;
  data: WorkoutEntry[];
}

function groupByDate(workouts: WorkoutEntry[]): Section[] {
  const map = new Map<string, WorkoutEntry[]>();
  for (const w of workouts) {
    if (!map.has(w.date)) map.set(w.date, []);
    map.get(w.date)!.push(w);
  }
  return Array.from(map.entries()).map(([date, data]) => ({
    title: formatDate(date),
    data,
  }));
}

export default function HistoryScreen({ navigation }: Props) {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [dayNumber, setDayNumber] = useState(0);
  const [programStarted, setProgramStarted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [fullPhoto, setFullPhoto] = useState<string | null>(null);
  const [restDays, setRestDays] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [wks, appData, rds] = await Promise.all([loadWorkouts(), loadData(), loadRestDays()]);
        setWorkouts(wks);
        setRestDays(rds);
        if (appData.startDate && appData.programStarted) {
          const day = getDayNumber(appData.startDate);
          setDayNumber(day);
          setDaysRemaining(Math.max(42 - day, 0));
          setProgramStarted(true);
        }
      })();
    }, []),
  );

  const score = computeFitnessScore(workouts, "", dayNumber, restDays);

  const markedDates = (() => {
    const marks: Record<string, any> = {};
    // workout days — teal dot
    for (const w of workouts) {
      marks[w.date] = {
        marked: true,
        dotColor: '#00E5CC',
        ...(selectedDate === w.date && { selected: true, selectedColor: 'rgba(0,229,204,0.25)' }),
      };
    }
    // rest days — purple dot (don't overwrite workout days)
    for (const d of restDays) {
      if (!marks[d]) {
        marks[d] = {
          marked: true,
          dotColor: '#8B5CF6',
          ...(selectedDate === d && { selected: true, selectedColor: 'rgba(139,92,246,0.2)' }),
        };
      }
    }
    // selected date with no data
    if (selectedDate && !marks[selectedDate]) {
      marks[selectedDate] = { selected: true, selectedColor: 'rgba(0,229,204,0.15)' };
    }
    return marks;
  })();

  const filteredWorkouts = selectedDate
    ? workouts.filter(w => w.date === selectedDate)
    : workouts;

  const sections = groupByDate(filteredWorkouts);

  const handleDelete = (id: string) => {
    Alert.alert("Delete workout?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = await deleteWorkout(id);
          setWorkouts(updated);
        },
      },
    ]);
  };

  const typeIcon = (type: string) =>
    WORKOUT_TYPES.find((t) => t.label === type)?.icon ?? "⚡";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* <LinearGradient colors={['#020B18', '#041428', '#020B18']} style={styles.bg} /> */}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => navigation.navigate("LogWorkout")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#00BFFF", "#39FF14"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.logBtnText}>+ Log</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Calendar */}
            <Calendar
              markedDates={markedDates}
              onDayPress={(day: { dateString: string }) =>
                setSelectedDate(prev => prev === day.dateString ? null : day.dateString)
              }
              theme={{
                calendarBackground: 'transparent',
                backgroundColor: 'transparent',
                dayTextColor: '#fff',
                todayTextColor: '#00E5CC',
                selectedDayBackgroundColor: 'rgba(0,229,204,0.25)',
                selectedDayTextColor: '#00E5CC',
                monthTextColor: '#fff',
                arrowColor: '#00E5CC',
                textDisabledColor: 'rgba(255,255,255,0.2)',
                dotColor: '#00E5CC',
                textDayFontWeight: '600',
                textMonthFontWeight: '800',
                textDayHeaderFontWeight: '600',
              }}
              style={styles.calendar}
            />
            {selectedDate && (
              <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.clearFilter}>
                <Text style={styles.clearFilterText}>Showing {formatDate(selectedDate)}  ✕ Clear</Text>
              </TouchableOpacity>
            )}

            {/* Days remaining banner */}
            {programStarted && daysRemaining !== null && (
              <View style={styles.bannerRow}>
                <View style={[styles.bannerCard, styles.bannerCardLeft]}>
                  <Text style={styles.bannerValue}>{daysRemaining}</Text>
                  <Text style={styles.bannerLabel}>Days Left</Text>
                </View>
                <View style={[styles.bannerCard, styles.bannerCardRight]}>
                  <Text
                    style={[styles.bannerValue, { color: score.levelColor }]}
                  >
                    {score.total}
                  </Text>
                  <Text style={styles.bannerLabel}>Fitness Score</Text>
                </View>
              </View>
            )}

            {/* Progress chart */}
            {workouts.length >= 2 && (
              <View style={styles.chartCard}>
                <Text style={styles.sectionTitle}>Fitness Score Over Time</Text>
                <ProgressChart
                  scores={computeScoreHistory(workouts, '', dayNumber, restDays)}
                  currentDay={dayNumber}
                />
              </View>
            )}

            {/* Score breakdown */}
            {workouts.length > 0 && (
              <View style={styles.scoreBreakdown}>
                <Text style={styles.sectionTitle}>Score Breakdown</Text>
                {[
                  {
                    label: "Consistency",
                    value: score.consistency,
                    desc: `${workouts.length > 0 ? new Set(workouts.map((w) => w.date)).size : 0} active days`,
                  },
                  {
                    label: "Effort",
                    value: score.effort,
                    desc: `avg feeling ${score.avgFeeling}/5`,
                  },
                  {
                    label: "Volume",
                    value: score.volume,
                    desc: `avg ${score.avgDuration} min/session`,
                  },
                ].map((row) => (
                  <View key={row.label} style={styles.scoreRow}>
                    <View style={styles.scoreRowLeft}>
                      <Text style={styles.scoreRowLabel}>{row.label}</Text>
                      <Text style={styles.scoreRowDesc}>{row.desc}</Text>
                    </View>
                    <View style={styles.scoreBarWrap}>
                      <View style={styles.scoreBarBg}>
                        <LinearGradient
                          colors={["#00BFFF", "#39FF14"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.scoreBarFill,
                            { width: `${row.value}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.scoreBarValue}>{row.value}</Text>
                    </View>
                  </View>
                ))}
                <View style={styles.statsRow}>
                  <View style={styles.statChip}>
                    <Text style={styles.statChipValue}>
                      {formatMins(score.totalMinutes)}
                    </Text>
                    <Text style={styles.statChipLabel}>Total time</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Text style={styles.statChipValue}>{score.streak}</Text>
                    <Text style={styles.statChipLabel}>Day streak</Text>
                  </View>
                  <View style={styles.statChip}>
                    <Text
                      style={[
                        styles.statChipValue,
                        { color: score.levelColor },
                      ]}
                    >
                      {score.level}
                    </Text>
                    <Text style={styles.statChipLabel}>Level</Text>
                  </View>
                </View>
              </View>
            )}

            {workouts.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No workouts yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap + Log to record your first session
                </Text>
              </View>
            )}

            {workouts.length > 0 && (
              <Text style={styles.sectionTitle}>Workouts</Text>
            )}
          </>
        }
        renderSectionHeader={({ section }) =>
          workouts.length > 0 ? (
            <Text style={styles.dateHeader}>{section.title}</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const feeling = FEELING_LABELS[item.feeling];
          return (
            <Swipeable
              renderRightActions={() => (
                <TouchableOpacity
                  style={styles.deleteAction}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.deleteActionText}>🗑</Text>
                  <Text style={styles.deleteActionLabel}>Delete</Text>
                </TouchableOpacity>
              )}
              overshootRight={false}
            >
              <TouchableOpacity
                style={styles.workoutCard}
                onPress={() => navigation.navigate('LogWorkout', { workout: item })}
                activeOpacity={0.75}
              >
                <View style={styles.cardAccent} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardTypeRow}>
                      <Text style={styles.cardIcon}>{typeIcon(item.type)}</Text>
                      <Text style={styles.cardType}>{item.type}</Text>
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>Day {item.dayNumber}</Text>
                      </View>
                      {item.timestamp && (
                        <Text style={styles.cardTime}>
                          {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.cardFeeling, { color: feeling.color }]}>
                      {feeling.emoji} {feeling.label}
                    </Text>
                  </View>
                  <View style={styles.cardStats}>
                    <Text style={styles.cardDuration}>{item.duration} min</Text>
                    {item.distanceMi != null && (
                      <Text style={styles.cardDistance}>📍 {item.distanceMi.toFixed(2)} mi</Text>
                    )}
                    {item.notes ? (
                      <Text style={styles.cardNotes} numberOfLines={2}>{item.notes}</Text>
                    ) : null}
                    {item.photoUri ? (
                      <TouchableOpacity onPress={() => setFullPhoto(item.photoUri!)}>
                        <Image source={{ uri: item.photoUri }} style={styles.cardThumb} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            </Swipeable>
          );
        }}
      />

      {/* Full-screen photo viewer */}
      <Modal visible={!!fullPhoto} transparent animationType="fade" onRequestClose={() => setFullPhoto(null)}>
        <View style={styles.photoModal}>
          <TouchableOpacity style={styles.photoModalClose} onPress={() => setFullPhoto(null)}>
            <Text style={styles.photoModalCloseText}>✕</Text>
          </TouchableOpacity>
          {fullPhoto && <Image source={{ uri: fullPhoto }} style={styles.photoModalImage} resizeMode="contain" />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020B18" },
  bg: { ...StyleSheet.absoluteFill },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#fff" },
  logBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  list: { paddingHorizontal: 20, paddingBottom: 40 },

  // Days remaining banner
  bannerRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  bannerCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bannerCardLeft: { borderColor: "rgba(0,191,255,0.3)" },
  bannerCardRight: { borderColor: "rgba(0,229,204,0.3)" },
  bannerValue: { fontSize: 36, fontWeight: "900", color: "#00BFFF" },
  bannerLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Score breakdown
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  scoreBreakdown: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  scoreRow: { marginBottom: 14 },
  scoreRowLeft: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  scoreRowLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
  },
  scoreRowDesc: { color: "rgba(255,255,255,0.35)", fontSize: 12 },
  scoreBarWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  scoreBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  scoreBarFill: { height: "100%", borderRadius: 3 },
  scoreBarValue: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    width: 28,
    textAlign: "right",
  },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  statChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  statChipValue: { color: "#00E5CC", fontSize: 13, fontWeight: "800" },
  statChipLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },

  // Section / date headers
  dateHeader: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 4,
  },

  // Workout card
  workoutCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTypeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardIcon: { fontSize: 18 },
  cardType: { fontSize: 15, fontWeight: "700", color: "#fff" },
  dayBadge: {
    backgroundColor: "rgba(0,191,255,0.15)",
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  dayBadgeText: { color: "#00BFFF", fontSize: 11, fontWeight: "700" },
  cardTime: { color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: "500" },
  cardFeeling: { fontSize: 13, fontWeight: "600" },
  cardStats: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardDuration: { color: "#00E5CC", fontSize: 18, fontWeight: "800" },
  cardDistance: { color: "rgba(0,229,204,0.7)", fontSize: 13, fontWeight: "600" },
  cardNotes: {
    flex: 1,
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 18,
  },

  // Calendar
  calendar: {
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  clearFilter: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0,229,204,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,204,0.3)',
  },
  clearFilterText: { color: '#00E5CC', fontSize: 13, fontWeight: '600' },

  // Swipe delete
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 16,
    marginBottom: 10,
  },
  deleteActionText: { fontSize: 20 },
  deleteActionLabel: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 2 },

  // Photo thumbnail
  cardThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Full-screen photo modal
  photoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImage: {
    width: '100%',
    height: '80%',
  },
  photoModalClose: {
    position: 'absolute',
    top: 56,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  photoModalCloseText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
