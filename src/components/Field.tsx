import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/theme';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric';
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  hint?: string;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  icon,
  hint,
}: FieldProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={[t.typography.label, { color: t.colors.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: focused ? t.colors.accentSoft : t.colors.cardAlt,
            borderColor: focused ? t.colors.accent : 'transparent',
            borderRadius: t.radius.md,
            alignItems: multiline ? 'flex-start' : 'center',
            minHeight: multiline ? 96 : 52,
          },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? t.colors.accent : t.colors.textSecondary}
            style={{ marginTop: multiline ? 2 : 0 }}
          />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={t.colors.textSecondary}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          style={[
            t.typography.body,
            styles.input,
            {
              color: t.colors.text,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
        />
      </View>
      {hint ? (
        <Text style={[t.typography.caption, { color: t.colors.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  input: { flex: 1, padding: 0 },
});
