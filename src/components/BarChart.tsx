import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/theme';

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartProps {
  data: BarDatum[];
  color?: string;
  highlightColor?: string;
  formatValue?: (v: number) => string;
  /** Height of the plot area (bars), excluding labels. */
  height?: number;
}

/** Minimal vertical bar chart built from Views — no chart library needed. */
export function BarChart({
  data,
  color,
  highlightColor,
  formatValue = (v) => `${v}`,
  height = 120,
}: BarChartProps) {
  const t = useTheme();
  const barColor = color ?? t.colors.accent;
  const hiColor = highlightColor ?? t.colors.danger;
  const max = data.reduce((m, d) => Math.max(m, d.value), 0);

  return (
    <View style={styles.wrap}>
      {data.map((d, i) => {
        const ratio = max > 0 ? d.value / max : 0;
        const barH = Math.max(d.value > 0 ? 6 : 3, Math.round(ratio * height));
        return (
          <View key={`${d.label}-${i}`} style={styles.col}>
            <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginBottom: 4 }]} numberOfLines={1}>
              {d.value > 0 ? formatValue(d.value) : ''}
            </Text>
            <View style={[styles.plot, { height }]}>
              <View
                style={{
                  width: '70%',
                  height: barH,
                  borderRadius: 6,
                  backgroundColor: d.value === 0 ? t.colors.border : d.highlight ? hiColor : barColor,
                }}
              />
            </View>
            <Text style={[t.typography.caption, { color: t.colors.textSecondary, marginTop: 6 }]} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center' },
  plot: { width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
});
