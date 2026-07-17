import { StyleSheet, View } from 'react-native';

import { Focusable, FocusGuide } from '@/platform/focus';
import { ThemedText } from '@/presentation/components/themed-text';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

/**
 * Netflix-style TV search keyboard: Space/Delete on top (3 cols each),
 * then a 6×6 A–Z + 0–9 grid.
 */
const CHAR_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', '1', '2', '3', '4'],
  ['5', '6', '7', '8', '9', '0'],
] as const;

const ROW_COUNT = CHAR_ROWS.length + 1; // + Space/Delete row

type TvKeyboardProps = {
  /** Measured height of the keyboard column (from parent onLayout). */
  availableHeight?: number;
  /** When false, do not steal focus (e.g. restoring a search result poster). */
  autoFocus?: boolean;
  onChar: (char: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
};

/**
 * Netflix-style on-screen alphabet keyboard for TV remotes.
 */
export function TvKeyboard({
  availableHeight = 0,
  autoFocus = true,
  onChar,
  onSpace,
  onBackspace,
}: TvKeyboardProps) {
  const theme = useTheme();
  const { scale, spacing } = useScreenDimensions();
  const gap = Math.max(4, Math.round(spacing.half));
  const minSize = Math.round(36 * scale);
  const maxSize = Math.round(52 * scale);
  const fallback = Math.round(44 * scale);

  const fitted =
    availableHeight > 0
      ? Math.floor((availableHeight - gap * (ROW_COUNT - 1)) / ROW_COUNT)
      : fallback;
  const keySize = Math.max(minSize, Math.min(maxSize, fitted));
  const wideKeyWidth = keySize * 3 + gap * 2;

  const keyStyle = (focused: boolean, width = keySize) => ({
    width,
    height: keySize,
    borderRadius: spacing.one,
    borderWidth: 2,
    borderColor: focused ? theme.tint : 'transparent',
    backgroundColor: focused
      ? theme.backgroundSelected
      : theme.backgroundElement,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  });

  return (
    <FocusGuide autoFocus={autoFocus} style={styles.wrap}>
      <View style={[styles.row, { gap, marginBottom: gap }]}>
        <Focusable
          onSelect={onSpace}
          style={({ focused }) => keyStyle(!!focused, wideKeyWidth)}
        >
          <ThemedText type="smallBold">Space</ThemedText>
        </Focusable>
        <Focusable
          onSelect={onBackspace}
          style={({ focused }) => keyStyle(!!focused, wideKeyWidth)}
        >
          <ThemedText type="smallBold">Delete</ThemedText>
        </Focusable>
      </View>

      {CHAR_ROWS.map((row, rowIndex) => (
        <View
          key={row.join('')}
          style={[
            styles.row,
            {
              gap,
              marginBottom: rowIndex === CHAR_ROWS.length - 1 ? 0 : gap,
            },
          ]}
        >
          {row.map((letter) => (
            <Focusable
              key={letter}
              onSelect={() => onChar(letter)}
              style={({ focused }) => keyStyle(!!focused)}
            >
              <ThemedText type="default">{letter}</ThemedText>
            </Focusable>
          ))}
        </View>
      ))}
    </FocusGuide>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
  },
});
