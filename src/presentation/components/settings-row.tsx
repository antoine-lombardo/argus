import { View } from 'react-native';

import { Focusable } from '@/platform/focus';
import { ThemedText } from '@/presentation/components/themed-text';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

export type SettingsRowProps = {
  label: string;
  value: string;
  onSelect?: () => void;
  disabled?: boolean;
  hint?: string;
  hasTVPreferredFocus?: boolean;
};

export function SettingsRow({
  label,
  value,
  onSelect,
  disabled,
  hint,
  hasTVPreferredFocus,
}: SettingsRowProps) {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();
  const interactive = Boolean(onSelect) && !disabled;

  return (
    <View style={{ gap: spacing.one }}>
      <Focusable
        disabled={!interactive}
        hasTVPreferredFocus={hasTVPreferredFocus}
        onSelect={interactive ? onSelect : undefined}
        style={({ focused }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing.three,
          paddingHorizontal: spacing.four,
          borderRadius: spacing.two,
          borderWidth: 3,
          borderColor: focused && interactive ? theme.tint : 'transparent',
          backgroundColor: theme.backgroundElement,
          opacity: disabled ? 0.55 : 1,
        })}
      >
        <ThemedText type="smallBold" style={{ flexShrink: 1, paddingRight: spacing.three }}>
          {label}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {value}
        </ThemedText>
      </Focusable>
      {hint ? (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={{ paddingHorizontal: spacing.four }}
        >
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}
