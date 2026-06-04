import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { resetAll, formatMins } from "../utils/storage";
import { cancelReminders } from "../utils/notifications";
import { resetMilestones } from "../utils/milestones";
import { ALL_PATHS, loadActivePaths, ActivePath } from "../utils/paths";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, "Complete">;
  route: RouteProp<RootStackParamList, "Complete">;
}


export default function CompleteScreen({ navigation, route }: Props) {
  const { score, totalWorkouts, totalMinutes, streak } = route.params;
  const [activePaths, setActivePaths] = useState<ActivePath[]>([]);

  useFocusEffect(useCallback(() => {
    loadActivePaths().then(setActivePaths);
  }, []));

  const handleStartAgain = () => {
    Alert.alert(
      "Start a New Challenge?",
      "This will reset all your current data and start fresh from Day 1. Your completed challenge is gone forever.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Fresh",
          style: "destructive",
          onPress: async () => {
            await resetAll();
            await cancelReminders();
            await resetMilestones();
            navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#020B18", "#041428", "#020B18"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Trophy */}
        <View style={styles.trophySection}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.congrats}>Challenge Complete!</Text>
          <Text style={styles.subtitle}>You finished all 42 days.</Text>
          <Text style={styles.subtitle}>
            That's something most people never do.
          </Text>
        </View>

        {/* Final score card */}
        <View style={styles.scoreCard}>
          <LinearGradient
            colors={["rgba(0,229,204,0.12)", "rgba(0,229,204,0.04)"]}
            style={styles.scoreCardInner}
          >
            <Text style={styles.scoreBig}>{score.total}</Text>
            <Text style={styles.scoreLabel}>Final Fitness Score</Text>
            <Text style={[styles.scoreLevel, { color: score.levelColor }]}>
              {score.level}
            </Text>
          </LinearGradient>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { value: totalWorkouts, label: "Workouts" },
            { value: formatMins(totalMinutes), label: "Total Time" },
            { value: streak, label: "Best Streak" },
          ].map((s) => (
            <View key={s.label} style={styles.statChip}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* What's Next */}
        <Text style={styles.sectionTitle}>What's Next?</Text>
        <Text style={styles.sectionSubtitle}>
          You built the habit. Now pick a goal.
        </Text>

        {ALL_PATHS.map((p) => {
          const isActive = activePaths.some(ap => ap.pathId === p.id);
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.pathCard, isActive && { borderColor: `${p.color}55`, backgroundColor: `${p.color}10` }]}
              activeOpacity={0.8}
              onPress={() =>
                isActive
                  ? navigation.navigate('PathProgress', { pathId: p.id })
                  : navigation.navigate('PathDetail', { pathId: p.id })
              }
            >
              <Text style={styles.pathIcon}>{p.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pathTitle, isActive && { color: p.color }]}>{p.title}</Text>
                <Text style={styles.pathDesc}>{p.weeks} weeks · {p.workoutType}</Text>
              </View>
              <View style={[styles.soonBadge, { borderColor: p.color }]}>
                <Text style={[styles.soonText, { color: p.color }]}>
                  {isActive ? '✓ Active' : 'Start →'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Start again */}
        <View style={styles.divider} />
        <Text style={styles.orText}>Or go again from the top</Text>

        <TouchableOpacity
          style={styles.startAgainBtn}
          onPress={handleStartAgain}
          activeOpacity={0.8}
        >
          <Text style={styles.startAgainText}>
            ↺ Start a New 42-Day Challenge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020B18" },
  scroll: { paddingHorizontal: 24, paddingTop: 60 },

  trophySection: { alignItems: "center", marginBottom: 32 },
  trophy: { fontSize: 80, marginBottom: 16 },
  congrats: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 24,
  },

  scoreCard: { borderRadius: 24, overflow: "hidden", marginBottom: 20 },
  scoreCardInner: {
    paddingTop: 4,
    paddingBottom: 10,
    paddingHorizontal: 32,
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.25)",
  },
  scoreBig: { fontSize: 64, fontWeight: "900", color: "#00E5CC" },
  scoreLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
    letterSpacing: 1,
  },
  scoreLevel: { fontSize: 20, fontWeight: "800", marginTop: 6 },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 36 },
  statChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statValue: { fontSize: 18, fontWeight: "900", color: "#00BFFF" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 20,
  },

  pathCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
  },
  pathIcon: { fontSize: 28 },
  pathTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  pathDesc: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  soonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  soonText: { fontSize: 11, fontWeight: "700" },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 28,
  },
  orText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    marginBottom: 16,
  },

  startAgainBtn: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,229,204,0.3)",
    alignItems: "center",
    marginBottom: 12,
  },
  startAgainText: { color: "#00E5CC", fontSize: 15, fontWeight: "700" },

  backBtn: { padding: 14, alignItems: "center" },
  backText: { color: "rgba(255,255,255,0.3)", fontSize: 14 },
});
