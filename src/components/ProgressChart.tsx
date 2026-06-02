import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface Props {
  scores: number[];   // one value per day, e.g. [0, 12, 18, ...]
  currentDay: number;
}

const W = 320;
const H = 140;
const PAD = { top: 16, right: 16, bottom: 28, left: 32 };
const chartW = W - PAD.left - PAD.right;
const chartH = H - PAD.top - PAD.bottom;

const Y_LABELS = [0, 25, 50, 75, 100];
const LEVEL_COLORS: Record<number, string> = { 80: '#39FF14', 60: '#00E5CC', 40: '#00BFFF', 20: '#8B5CF6', 0: '#6B7280' };

function getLevelColor(score: number): string {
  for (const threshold of [80, 60, 40, 20, 0]) {
    if (score >= threshold) return LEVEL_COLORS[threshold];
  }
  return '#6B7280';
}

export default function ProgressChart({ scores, currentDay }: Props) {
  if (scores.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Log at least 2 days to see your chart</Text>
      </View>
    );
  }

  const total = 42;
  const xScale = (i: number) => (i / (total - 1)) * chartW;
  const yScale = (v: number) => chartH - (v / 100) * chartH;

  // Build SVG path
  const points = scores.map((v, i) => ({
    x: PAD.left + xScale(i),
    y: PAD.top + yScale(v),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Fill area under the curve
  const fillD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  const lastPoint = points[points.length - 1];
  const lastScore = scores[scores.length - 1];
  const dotColor = getLevelColor(lastScore);

  return (
    <View style={styles.container}>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00BFFF" />
            <Stop offset="100%" stopColor="#39FF14" />
          </LinearGradient>
          <LinearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#00E5CC" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#00E5CC" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Y grid lines */}
        {Y_LABELS.map(v => {
          const y = PAD.top + yScale(v);
          return (
            <Line
              key={v}
              x1={PAD.left} y1={y}
              x2={PAD.left + chartW} y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          );
        })}

        {/* Fill */}
        <Path d={fillD} fill="url(#fillGrad)" />

        {/* Line */}
        <Path d={pathD} stroke="url(#lineGrad)" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Current day dot */}
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={5} fill={dotColor} />
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={9} fill={dotColor} fillOpacity={0.25} />
      </Svg>

      {/* Y axis labels */}
      <View style={styles.yLabels}>
        {[...Y_LABELS].reverse().map(v => (
          <Text key={v} style={styles.yLabel}>{v}</Text>
        ))}
      </View>

      {/* X axis labels */}
      <View style={[styles.xLabels, { paddingLeft: PAD.left, paddingRight: PAD.right }]}>
        {[1, 7, 14, 21, 28, 35, 42].map(d => (
          <Text
            key={d}
            style={[styles.xLabel, d === currentDay && styles.xLabelActive]}
          >
            {d}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  yLabels: {
    position: 'absolute',
    top: PAD.top - 6,
    left: 0,
    width: PAD.left - 4,
    height: chartH + 12,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  xLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
  xLabelActive: { color: '#00E5CC', fontWeight: '700' },
  empty: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
});
