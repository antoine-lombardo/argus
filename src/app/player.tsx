import type { StreamDescriptor } from '@argus-tv/plugin-sdk';
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
  getFixturePlayback,
  parseMediaIdKey,
  playbackLabel,
} from '@/domain';
import { Focusable, FocusGuide } from '@/platform/focus';
import {
  drmBlockReason,
  drmSupportedOnPlatform,
  toVideoSource,
} from '@/platform/player';
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

function CannotPlay({ message, onBack }: { message: string; onBack: () => void }) {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();

  return (
    <FocusGuide autoFocus style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.fallback, { padding: spacing.five, gap: spacing.three }]}>
        <ThemedText type="title">Cannot play</ThemedText>
        <ThemedText themeColor="textSecondary">{message}</ThemedText>
        <Focusable
          hasTVPreferredFocus
          onSelect={onBack}
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

type ActivePlayerProps = {
  stream: StreamDescriptor;
  title: string;
  mediaKey: string;
};

/**
 * Only mounted when the stream is playable on this platform.
 * Avoids loading clear HLS as a placeholder (audio leak) and never creates
 * FairPlay ContentKeySession on Simulator (native crash).
 */
function ActivePlayer({ stream, title, mediaKey }: ActivePlayerProps) {
  const theme = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { spacing } = useScreenDimensions();
  const setMedia = usePlayerStore((s) => s.setMedia);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const setError = usePlayerStore((s) => s.setError);
  const error = usePlayerStore((s) => s.error);
  const reset = usePlayerStore((s) => s.reset);

  const player = useVideoPlayer(toVideoSource(stream), (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.volume = 1;
    instance.playbackRate = 1;
    instance.play();
  });

  const playerRef = useRef(player);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const goBack = useCallback(() => {
    safePause(playerRef.current);
    router.back();
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      safePlay(playerRef.current);
      setStatus('playing');
      return () => {
        safePause(playerRef.current);
      };
    }, [setStatus]),
  );

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      safePause(playerRef.current);
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    setMedia(mediaKey);
    return () => {
      reset();
    };
  }, [mediaKey, setMedia, reset]);

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
        {stream.drm ? (
          <ThemedText type="small" themeColor="textSecondary">
            DRM: {stream.drm.scheme}
          </ThemedText>
        ) : null}
        {error ? (
          <ThemedText type="small" style={{ color: '#ff8a80' }}>
            {error}
          </ThemedText>
        ) : null}
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

/**
 * Full-screen player shell — expo-video (ADR 0006).
 * Maps `StreamDescriptor` (incl. DRM) → `VideoSource`.
 */
export default function PlayerScreen() {
  const router = useRouter();

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
  const title = id ? playbackLabel(id) : 'Player';

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!stream || !mediaKey) {
    return (
      <CannotPlay message="No fixture stream for this item." onBack={goBack} />
    );
  }

  if (stream.drm && !drmSupportedOnPlatform(stream.drm.scheme)) {
    return (
      <CannotPlay
        message={drmBlockReason(stream.drm.scheme)}
        onBack={goBack}
      />
    );
  }

  return <ActivePlayer stream={stream} title={title} mediaKey={mediaKey} />;
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
