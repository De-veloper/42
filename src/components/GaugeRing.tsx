import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  value: string | number;
  label: string;
  sub?: string;
  progress: number;      // 0–1
  size?: number;
  color?: string;
  gradientColors?: [string, string];
}

export default function GaugeRing({
  value,
  label,
  sub,
  progress,
  size = 130,
  color = '#00E5CC',
  gradientColors,
}: Props) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const ARC = 0.75; // 270° arc
  const arcLen = circumference * ARC;
  const fillLen = arcLen * Math.min(Math.max(progress, 0), 1);
  const id = `grad-${String(label).replace(/\s/g, '')}`;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradientColors?.[0] ?? color} />
            <Stop offset="100%" stopColor={gradientColors?.[1] ?? color} />
          </LinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${arcLen} ${circumference - arcLen}`}
          rotation={135}
          origin={`${cx}, ${cy}`}
          strokeLinecap="round"
        />

        {/* Fill */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={gradientColors ? `url(#${id})` : color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${fillLen} ${circumference - fillLen}`}
          rotation={135}
          origin={`${cx}, ${cy}`}
          strokeLinecap="round"
        />
      </Svg>

      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.value, { color: gradientColors ? '#00E5CC' : color }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        {sub ? <Text style={[styles.sub, { color: gradientColors ? '#00E5CC' : color }]}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 28, fontWeight: '900', lineHeight: 32 },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5, marginTop: 1 },
  sub: { fontSize: 10, fontWeight: '700', marginTop: 2 },
});
