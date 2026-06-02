import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
}

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#020B18', '#041428', '#020B18']}
        style={styles.bg}
      />

      {/* Glow effect */}
      <View style={styles.glowTopLeft} />
      <View style={styles.glowBottomRight} />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoShadow}>
          <LinearGradient
            colors={['#00BFFF', '#00E5CC', '#39FF14']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <Text style={styles.logoText}>42</Text>
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>42</Text>
        <Text style={styles.subtitle}>The 42-Day Fitness Challenge</Text>

        <View style={styles.divider} />

        {/* Description */}
        <Text style={styles.description}>
          Build a life-changing habit in 42 days.{'\n'}
          Track every workout. Stay consistent.{'\n'}
          Transform yourself.
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { value: '42', label: 'Days' },
            { value: '6', label: 'Weeks' },
            { value: '∞', label: 'Results' },
          ].map(stat => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.btnWrapper}>
          <TouchableOpacity
            style={styles.btnInner}
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#00BFFF', '#00E5CC', '#39FF14']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Start My 42 Days</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>No equipment needed · Beginner friendly</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020B18' },
  bg: { ...StyleSheet.absoluteFill },
  glowTopLeft: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#00BFFF',
    opacity: 0.06,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -80,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: '#39FF14',
    opacity: 0.05,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoShadow: {
    marginBottom: 20,
    borderRadius: 24,
    backgroundColor: '#00E5CC',
    shadowColor: '#00E5CC',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#020B18',
    letterSpacing: -1,
  },
  title: {
    fontSize: 64,
    fontWeight: '900',
    color: '#00E5CC',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    letterSpacing: 1,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#00E5CC',
    borderRadius: 1,
    marginVertical: 24,
    opacity: 0.5,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 40,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00E5CC',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginTop: 2,
  },
  btnWrapper: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#00E5CC',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  btnInner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  btn: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  btnText: {
    color: '#020B18',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footnote: {
    marginTop: 16,
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
  },
});
