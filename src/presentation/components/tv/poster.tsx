import { Image } from 'expo-image';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Focusable } from '@/platform/focus';
import { ThemedText } from '@/presentation/components/themed-text';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

const FOCUS_RING = 3;

type PosterProps = {
  title?: string;
  /** Poster art URL (`MediaItem.artwork.poster`). */
  imageUrl?: string;
  /** Small corner badge (e.g. live status). */
  badge?: string;
  onSelect?: () => void;
  onFocus?: () => void;
  style?: StyleProp<ViewStyle>;
  hasTVPreferredFocus?: boolean;
};

/**
 * Focusable poster tile. Focus ring is a constant-width border outside the art
 * (transparent when unfocused) so content never shifts or clips the ring.
 */
export function Poster({
  title = 'Poster',
  imageUrl,
  badge,
  onSelect,
  onFocus,
  style,
  hasTVPreferredFocus,
}: PosterProps) {
  const theme = useTheme();
  const { spacing, scale } = useScreenDimensions();
  const artWidth = 120 * scale;
  const artHeight = 180 * scale;

  return (
    <Focusable
      onSelect={onSelect}
      onFocus={onFocus}
      hasTVPreferredFocus={hasTVPreferredFocus}
      style={({ focused }) => [
        {
          // Border sits outside the art: outer = art + ring on each side.
          width: artWidth + FOCUS_RING * 2,
          height: artHeight + FOCUS_RING * 2,
          borderWidth: FOCUS_RING,
          borderColor: focused ? theme.tint : 'transparent',
          borderRadius: spacing.two + FOCUS_RING,
          backgroundColor: 'transparent',
        },
        style,
      ]}
    >
      <View
        style={{
          flex: 1,
          borderRadius: spacing.two,
          backgroundColor: theme.backgroundElement,
          overflow: 'hidden',
        }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : null}
        <View style={[styles.caption, { padding: spacing.two }]}>
          {badge ? (
            <ThemedText type="smallBold" style={styles.badge}>
              {badge}
            </ThemedText>
          ) : null}
          <ThemedText type="small" numberOfLines={2}>
            {title}
          </ThemedText>
        </View>
      </View>
    </Focusable>
  );
}

const styles = StyleSheet.create({
  caption: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  badge: {
    marginBottom: 4,
  },
});
