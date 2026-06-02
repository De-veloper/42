import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  currentDay: number;
}

export default function CircularProgress({ progress, size = 220, strokeWidth = 14, currentDay }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00BFFF" />
            <Stop offset="100%" stopColor="#39FF14" />
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Dashed segment indicators */}
        {Array.from({ length: 42 }, (_, i) => {
          const angle = ((i / 42) * 360 - 90) * (Math.PI / 180);
          const x1 = center + (radius - strokeWidth) * Math.cos(angle);
          const y1 = center + (radius - strokeWidth) * Math.sin(angle);
          const x2 = center + (radius + strokeWidth / 2) * Math.cos(angle);
          const y2 = center + (radius + strokeWidth / 2) * Math.sin(angle);
          return null; // visual handled by progress arc
        })}

        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      <View style={[styles.innerContent, { width: size, height: size }]}>
        <Text style={styles.dayLabel}>DAY</Text>
        <Text style={styles.dayNumber}>{currentDay}</Text>
        <Text style={styles.outOf}>of 42</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '600',
  },
  dayNumber: {
    color: '#00E5CC',
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 80,
  },
  outOf: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '500',
  },
});
