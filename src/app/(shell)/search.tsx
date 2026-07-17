import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useFocusRestoreStore } from '@/application/stores/focus-restore-store';
import { useSearchStore } from '@/application/stores/search-store';
import { mediaIdKey, searchFixtures } from '@/domain';
import { ThemedText } from '@/presentation/components/themed-text';
import { PosterGrid, Screen, TvKeyboard } from '@/presentation/components/tv';
import { useRestoreFocusKey } from '@/presentation/hooks/use-restore-focus-key';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

const DEBOUNCE_MS = 300;

/**
 * Search — on-screen TV keyboard + debounced fixture results grid.
 */
export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { spacing } = useScreenDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const remember = useFocusRestoreStore((s) => s.remember);
  const { restoreKey, onRestoredFocus } = useRestoreFocusKey();
  const query = useSearchStore((s) => s.query);
  const status = useSearchStore((s) => s.status);
  const results = useSearchStore((s) => s.results);
  const appendChar = useSearchStore((s) => s.appendChar);
  const backspace = useSearchStore((s) => s.backspace);
  const setResults = useSearchStore((s) => s.setResults);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!query.trim()) {
        useSearchStore.setState({ results: [], status: 'idle', error: null });
        return;
      }
      setResults(searchFixtures(query));
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, setResults]);

  const hint =
    status === 'idle'
      ? 'Type to search fixtures'
      : status === 'loading'
        ? 'Searching…'
        : results.length === 0
          ? 'No matches'
          : `${results.length} result${results.length === 1 ? '' : 's'}`;

  return (
    <Screen style={styles.screen}>
      <ThemedText type="title">Search</ThemedText>
      <View
        style={[
          styles.queryBox,
          {
            backgroundColor: theme.backgroundElement,
            paddingVertical: spacing.two,
            paddingHorizontal: spacing.three,
            marginBottom: spacing.two,
            borderRadius: spacing.two,
          },
        ]}
      >
        <ThemedText
          type="subtitle"
          themeColor={query ? 'text' : 'textSecondary'}
        >
          {query || 'Search…'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      </View>

      <View
        style={[styles.body, { gap: spacing.four }]}
        onLayout={(e) => setKeyboardHeight(e.nativeEvent.layout.height)}
      >
        <TvKeyboard
          availableHeight={keyboardHeight}
          autoFocus={restoreKey == null}
          onChar={appendChar}
          onSpace={() => appendChar(' ')}
          onBackspace={backspace}
        />
        <View style={styles.results}>
          <PosterGrid
            items={results}
            restoreKey={restoreKey}
            onRestoredFocus={onRestoredFocus}
            onSelectItem={(item) => {
              remember(mediaIdKey(item.id));
              router.push({
                pathname: '/detail',
                params: {
                  pluginId: item.id.pluginId,
                  type: item.id.type,
                  providerId: item.id.providerId,
                },
              });
            }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 24,
  },
  queryBox: {
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  results: {
    flex: 1,
  },
});
