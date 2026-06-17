import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/theme/theme';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric';
  optional?: boolean;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  optional = true,
}: FieldProps) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>
        {label}
        {optional ? <Text style={{ color: t.colors.textSecondary }}>  ·  optional</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.textSecondary}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={[
          t.typography.body,
          {
            color: t.colors.text,
            backgroundColor: t.colors.card,
            borderColor: t.colors.border,
            borderRadius: t.radius.md,
            borderWidth: 1,
            paddingHorizontal: 14,
            paddingVertical: 14,
            minHeight: multiline ? 96 : 52,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
});
