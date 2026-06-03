import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { ALL_PATHS, startPath, loadActivePath, loadActivePaths } from '../utils/paths';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PathDetail'>;
  route: RouteProp<RootStackParamList, 'PathDetail'>;
}

export default function PathDetailScreen({ navigation, route }: Props) {
  const { pathId } = route.params;
  const path = ALL_PATHS.find(p => p.id === pathId)!;
  const [hasActivePath, setHasActivePath] = useState(false);

  useEffect(() => {
    loadActivePath(pathId).then(ap => setHasActivePath(!!ap));
  }, []);

  const handleStart = async () => {
    await startPath(pathId);
    setHasActivePath(true);
    // Go back to CompleteScreen so user can pick additional paths
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
              <Text style={styles.metaValue}>{path.weeks}</Text>
              <Text style={styles.metaLabel}>Weeks</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaValue}>{path.weeklyPlan.reduce((s,w) => s + w.sessions, 0)}</Text>
              <Text style={styles.metaLabel}>Total Sessions</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaValue}>{path.workoutType}</Text>
              <Text style={styles.metaLabel}>Type</Text>
            </View>
          </View>
        </View>

        {/* Weekly plan */}
        <Text style={styles.sectionTitle}>Weekly Plan</Text>
        {path.weeklyPlan.map((w) => (
          <View key={w.week} style={styles.weekRow}>
            <View style={[styles.weekBadge, { borderColor: path.color }]}>
              <Text style={[styles.weekNum, { color: path.color }]}>W{w.week}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.weekDesc}>{w.description}</Text>
              <Text style={styles.weekMeta}>
                {w.sessions}× per week · {w.minDuration}+ min
                {w.targetMi ? `  ·  ${w.targetMi} mi target` : ''}
              </Text>
            </View>
          </View>
        ))}

        {/* CTA */}
        <View style={{ height: 32 }} />
        {hasActivePath ? (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => navigation.replace('PathProgress', { pathId })}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue My Progress →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startBtnWrapper} onPress={handleStart} activeOpacity={0.85}>
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
});
