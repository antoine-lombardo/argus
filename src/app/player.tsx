import { useEvent } from 'expo';
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from 'expo-router';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePlayerStore } from '@/application/stores/player-store';
import {
  CLEAR_HLS_URL,
  getFixturePlayback,
  parseMediaIdKey,
  playbackLabel,
} from '@/domain';
import { Focusable, FocusGuide } from '@/platform/focus';
import { ThemedText } from '@/presentation/components/themed-text';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

/** Native shared object may already be released by `useVideoPlayer` on unmount. */
function safePause(player: VideoPlayer) {
  try {
    player.pause();
  } catch {
    // ignore — ERR_NATIVE_SHARED_OBJECT_NOT_FOUND
  }
}

function safePlay(player: VideoPlayer) {
  try {
    player.muted = false;
    player.playbackRate = 1;
    player.play();
  } catch {
    // ignore
  }
}

/**
 * Full-screen player shell — clear HLS via expo-video (ADR 0006).
 *
 * Lifecycle: pause on blur / beforeRemove (expo #42512). Focus effect deps must
 * be stable — never depend on a freshly allocated `StreamDescriptor` object.
 *
 * Focus: wrap VideoView in TVFocusGuideView focusable={false} (expo #40264).
 */
export default function PlayerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { spacing } = useScreenDimensions();
  const setMedia = usePlayerStore((s) => s.setMedia);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const setError = usePlayerStore((s) => s.setError);
  const reset = usePlayerStore((s) => s.reset);

  const params = useLocalSearchParams<{
    pluginId?: string;
    type?: string;
    providerId?: string;
  }>();

  const mediaKey =
    params.pluginId && params.type && params.providerId
      ? `${params.pluginId}/${params.type}/${params.providerId}`
      : null;
  const id = mediaKey ? parseMediaIdKey(mediaKey) : null;
  const stream = id ? getFixturePlayback(id) : undefined;
  /** Stable across renders — object identity of `stream` / `id` is not. */
  const streamUrl = stream?.url;
  const title = id ? playbackLabel(id) : 'Player';

  const player = useVideoPlayer(
    {
      uri: streamUrl ?? CLEAR_HLS_URL,
      contentType: 'hls',
    },
    (instance) => {
      instance.loop = false;
      instance.muted = false;
      instance.volume = 1;
      instance.playbackRate = 1;
      if (streamUrl) {
        instance.play();
      }
    },
  );

  const playerRef = useRef(player);
  playerRef.current = player;

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const goBack = useCallback(() => {
    safePause(playerRef.current);
    router.back();
  }, [router]);

  // Pause only when leaving focus. Depend on streamUrl (string), not `stream`.
  useFocusEffect(
    useCallback(() => {
      if (streamUrl) {
        safePlay(playerRef.current);
        setStatus('playing');
      }
      return () => {
        safePause(playerRef.current);
      };
    }, [streamUrl, setStatus]),
  );

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      safePause(playerRef.current);
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    if (!mediaKey || !streamUrl) {
      setError('No playable stream for this title');
      return;
    }
    setMedia(mediaKey);
    return () => {
      reset();
    };
  }, [mediaKey, streamUrl, setMedia, setError, reset]);

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error') {
        setError(error?.message ?? 'Playback failed');
      }
    });
    return () => {
      sub.remove();
    };
  }, [player, setError]);

  if (!stream || !streamUrl) {
    return (
      <FocusGuide autoFocus style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.fallback, { padding: spacing.five, gap: spacing.three }]}>
          <ThemedText type="title">Cannot play</ThemedText>
          <ThemedText themeColor="textSecondary">
            No fixture stream for this item.
          </ThemedText>
          <Focusable
            hasTVPreferredFocus
            onSelect={goBack}
            style={({ focused }) => ({
              alignSelf: 'flex-start',
              paddingVertical: spacing.three,
              paddingHorizontal: spacing.five,
              borderRadius: spacing.two,
              borderWidth: 3,
              borderColor: focused ? theme.tint : 'transparent',
              backgroundColor: theme.backgroundElement,
            })}
          >
            <ThemedText type="smallBold">Back</ThemedText>
          </Focusable>
        </View>
      </FocusGuide>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: '#000' }]}>
      <FocusGuide focusable={false} style={styles.video}>
        <VideoView
          player={player}
          nativeControls={false}
          contentFit="contain"
          style={StyleSheet.absoluteFill}
        />
      </FocusGuide>

      <FocusGuide
        autoFocus
        style={[
          styles.chrome,
          {
            padding: spacing.four,
            gap: spacing.three,
          },
        ]}
      >
        <ThemedText type="subtitle">{title}</ThemedText>
        <View style={[styles.actions, { gap: spacing.three }]}>
          <Focusable
            hasTVPreferredFocus
            onSelect={() => {
              if (isPlaying) {
                safePause(player);
                setStatus('paused');
              } else {
                safePlay(player);
                setStatus('playing');
              }
            }}
            style={({ focused }) => ({
              paddingVertical: spacing.three,
              paddingHorizontal: spacing.five,
              borderRadius: spacing.two,
              borderWidth: 3,
              borderColor: focused ? theme.tint : 'transparent',
              backgroundColor: theme.backgroundSelected,
            })}
          >
            <ThemedText type="smallBold">Play / Pause</ThemedText>
          </Focusable>
          <Focusable
            onSelect={goBack}
            style={({ focused }) => ({
              paddingVertical: spacing.three,
              paddingHorizontal: spacing.five,
              borderRadius: spacing.two,
              borderWidth: 3,
              borderColor: focused ? theme.tint : 'transparent',
              backgroundColor: theme.backgroundElement,
            })}
          >
            <ThemedText type="smallBold">Back</ThemedText>
          </Focusable>
        </View>
      </FocusGuide>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  chrome: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
  },
});
