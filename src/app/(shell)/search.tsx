import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useFocusRestoreStore } from '@/application/stores/focus-restore-store';
import { useSearchStore } from '@/application/stores/search-store';
import { aggregateSearch, mediaIdKey } from '@/domain';
import { bootPlugins } from '@/platform/kernel/boot';
import { ThemedText } from '@/presentation/components/themed-text';
import { PosterGrid, Screen, TvKeyboard } from '@/presentation/components/tv';
import { useRestoreFocusKey } from '@/presentation/hooks/use-restore-focus-key';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

const DEBOUNCE_MS = 300;

/** Search — federated query across enabled plugins. */
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
  const error = useSearchStore((s) => s.error);
  const appendChar = useSearchStore((s) => s.appendChar);
  const backspace = useSearchStore((s) => s.backspace);
  const setResults = useSearchStore((s) => s.setResults);
  const setError = useSearchStore((s) => s.setError);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      void (async () => {
        if (!query.trim()) {
          useSearchStore.setState({ results: [], status: 'idle', error: null });
          return;
        }
        try {
          await bootPlugins();
          const result = await aggregateSearch(query, (partial) => {
            if (cancelled) return;
            // Don't clear a pending error while partials arrive empty.
            if (partial.errors.length > 0 && partial.items.length === 0) {
              useSearchStore.setState({
                results: [],
                status: 'error',
                error: partial.errors
                  .map((e) => `${e.pluginId}: ${e.message}`)
                  .join('\n'),
              });
              return;
            }
            setResults(partial.items);
          });
          if (cancelled) return;
          if (result.errors.length > 0 && result.items.length === 0) {
            useSearchStore.setState({
              results: [],
              status: 'error',
              error: result.errors
                .map((e) => `${e.pluginId}: ${e.message}`)
                .join('\n'),
            });
          } else {
            setResults(result.items);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : String(err));
          }
        }
      })();
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, setResults, setError]);

  const hint =
    status === 'idle'
      ? 'Type to search plugins (try THROW to demo errors)'
      : status === 'loading'
        ? 'Searching…'
        : error
          ? error
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
