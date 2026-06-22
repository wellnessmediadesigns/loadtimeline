import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { Card, EmptyState, Screen, ScreenHeading } from '@/components';
import { useTheme } from '@/theme/theme';
import { listReports, deleteReport } from '@/db/queries/reports';
import { shareReportFile } from '@/lib/pdf';
import { formatDateTime } from '@/lib/format';
import type { Report } from '@/types';

export default function Reports() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<Report[]>([]);

  const reload = useCallback(() => setReports(listReports()), []);
  useFocusEffect(useCallback(() => reload(), [reload]));

  const onOpen = async (r: Report) => {
    try {
      if (!new File(r.fileUri).exists) {
        Alert.alert('Report unavailable', 'This report file is no longer on the device. You can regenerate it from the load.');
        return;
      }
      await shareReportFile(r.fileUri);
    } catch {
      Alert.alert('Could not open report', 'Please try again.');
    }
  };

  const onDelete = (r: Report) => {
    Alert.alert('Delete report?', 'This removes the saved PDF from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            const f = new File(r.fileUri);
            if (f.exists) f.delete();
          } catch {
            // best-effort
          }
          deleteReport(r.id);
          reload();
        },
      },
    ]);
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top + 8 }}>
      <ScreenHeading title="Reports" subtitle="Every report you've generated." icon="document-text" />

      {reports.length === 0 ? (
        <Card>
          <EmptyState
            icon="document-text-outline"
            title="No reports yet"
            message="Open a load, tap Generate Report, and share it — your reports are saved here to revisit or re-send anytime."
          />
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {reports.map((r) => (
            <Card key={r.id} onPress={() => onOpen(r)} style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: t.colors.violetSoft }]}>
                <Ionicons name="document-text" size={20} color={t.colors.violet} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[t.typography.subtitle, { color: t.colors.text }]} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text style={[t.typography.caption, { color: t.colors.textSecondary }]} numberOfLines={1}>
                  {[r.scope, formatDateTime(r.createdAt)].filter(Boolean).join('  ·  ')}
                </Text>
              </View>
              <Ionicons name="share-outline" size={20} color={t.colors.accent} />
              <Pressable onPress={() => onDelete(r)} hitSlop={10} style={{ marginLeft: 4 }}>
                <Ionicons name="trash-outline" size={19} color={t.colors.textSecondary} />
              </Pressable>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
