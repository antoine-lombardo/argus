import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BrandMarkSvg } from '@/presentation/components/brand-mark-svg';
import { ThemedText } from '@/presentation/components/themed-text';
import { useTheme } from '@/presentation/hooks/use-theme';

type BrandLogoProps = {
  /** Mark height in px; width follows the wide eye aspect. */
  size?: number;
  /**
   * `mark` — vector from `icon-mark.svg`, tinted to theme text.
   * `app` — full gradient app-icon tile.
   */
  variant?: 'mark' | 'app';
  /** Show “Argus” wordmark beside the mark. */
  showWordmark?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** In-app Argus mark — SVG paths for `mark`, raster tile for `app`. */
export function BrandLogo({
  size = 28,
  variant = 'mark',
  showWordmark = false,
  style,
}: BrandLogoProps) {
  const theme = useTheme();
  // Tight SVG viewBox is ~544×288 ≈ 1.89∶1.
  const markWidth = Math.round(size * 1.89);

  return (
    <View style={[styles.row, style]}>
      {variant === 'app' ? (
        <Image
          source={require('@/assets/images/icon.png')}
          style={{
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.18),
          }}
          contentFit="cover"
          accessibilityLabel="Argus"
        />
      ) : (
        <BrandMarkSvg
          width={markWidth}
          height={size}
          color={theme.text}
        />
      )}
      {showWordmark ? (
        <ThemedText type="subtitle" style={styles.wordmark}>
          Argus
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    flexShrink: 1,
  },
});
