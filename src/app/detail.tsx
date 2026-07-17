import type { Episode, MediaDetails, MediaType } from '@argus-tv/plugin-sdk';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { usePlayerStore } from '@/application/stores/player-store';
import { getFixtureDetails, mediaIdKey, parseMediaIdKey } from '@/domain';
import { Focusable, FocusGuide } from '@/platform/focus';
import { ThemedText } from '@/presentation/components/themed-text';
import { Screen } from '@/presentation/components/tv';
import { useScreenDimensions } from '@/presentation/hooks/use-screen-dimensions';
import { useTheme } from '@/presentation/hooks/use-theme';

function typeLabel(type: MediaType): string {
  switch (type) {
    case 'movie':
      return 'Movie';
    case 'series':
      return 'Series';
    case 'episode':
      return 'Episode';
    case 'liveEvent':
      return 'Live';
    default:
      return type;
  }
}

function formatRuntime(minutes?: number): string | undefined {
  if (minutes == null) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function liveLabel(details: MediaDetails): string | undefined {
  const info = details.liveInfo;
  if (!info) return undefined;
  if (info.status === 'live') return 'LIVE NOW';
  if (info.status === 'upcoming') return 'UPCOMING';
  return 'ENDED';
}

type ActionButtonProps = {
  label: string;
  onSelect: () => void;
  primary?: boolean;
  hasTVPreferredFocus?: boolean;
};

function ActionButton({
  label,
  onSelect,
  primary,
  hasTVPreferredFocus,
}: ActionButtonProps) {
  const theme = useTheme();
  const { spacing } = useScreenDimensions();

  return (
    <Focusable
      onSelect={onSelect}
      hasTVPreferredFocus={hasTVPreferredFocus}
      style={({ focused }) => ({
        paddingVertical: spacing.three,
        paddingHorizontal: spacing.five,
        borderRadius: spacing.two,
        borderWidth: 3,
        borderColor: focused ? theme.tint : 'transparent',
        backgroundColor: primary
          ? focused
            ? theme.tint
            : theme.backgroundSelected
          : theme.backgroundElement,
      })}
    >
      <ThemedText type="smallBold">{label}</ThemedText>
    </Focusable>
  );
}

/**
 * Unified detail layout for movie / series / episode / liveEvent fixtures.
 */
export default function DetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { spacing, scale } = useScreenDimensions();
  const setMedia = usePlayerStore((s) => s.setMedia);
  const setStatus = usePlayerStore((s) => s.setStatus);

  const params = useLocalSearchParams<{
    pluginId?: string;
    type?: string;
    providerId?: string;
  }>();

  const id =
    params.pluginId && params.type && params.providerId
      ? parseMediaIdKey(
          `${params.pluginId}/${params.type}/${params.providerId}`,
        )
      : null;
  const details = id ? getFixtureDetails(id) : undefined;

  if (!details) {
    return (
      <FocusGuide autoFocus style={styles.root}>
        <Screen>
          <ThemedText type="title">Not found</ThemedText>
          <ThemedText themeColor="textSecondary">
            This title isn’t in the fixture catalog.
          </ThemedText>
          <ActionButton
            label="Back"
            onSelect={() => router.back()}
            hasTVPreferredFocus
          />
        </Screen>
      </FocusGuide>
    );
  }

  const meta = [
    typeLabel(details.type),
    details.year?.toString(),
    formatRuntime(details.runtime),
    details.genres.slice(0, 3).join(' · ') || undefined,
  ]
    .filter(Boolean)
    .join('  ·  ');

  const playLabel =
    details.type === 'liveEvent'
      ? details.liveInfo?.status === 'live'
        ? 'Watch live'
        : 'Set reminder'
      : details.type === 'series'
        ? 'Play S1E1'
        : 'Play';

  const heroUri = details.artwork.backdrop ?? details.artwork.poster;
  const posterUri = details.artwork.poster;
  const posterW = 160 * scale;
  const posterH = 240 * scale;

  const playTarget =
    details.type === 'series' && details.seasons?.[0]?.episodes?.[0]
      ? details.seasons[0].episodes[0].id
      : details.id;

  const onPlay = () => {
    setMedia(mediaIdKey(playTarget));
    setStatus('loading');
    router.push({
      pathname: '/player',
      params: {
        pluginId: playTarget.pluginId,
        type: playTarget.type,
        providerId: playTarget.providerId,
      },
    });
  };

  const seasons = details.seasons ?? [];

  return (
    <FocusGuide autoFocus style={styles.root}>
    <Screen style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: spacing.four,
          paddingBottom: spacing.five,
        }}
      >
        {heroUri ? (
          <View
            style={[
              styles.hero,
              {
                height: 220 * scale,
                borderRadius: spacing.two,
                backgroundColor: theme.backgroundElement,
              },
            ]}
          >
            <Image
              source={{ uri: heroUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.heroScrim} />
            {liveLabel(details) ? (
              <View
                style={[
                  styles.livePill,
                  {
                    top: spacing.three,
                    left: spacing.three,
                    paddingHorizontal: spacing.three,
                    paddingVertical: spacing.one,
                    borderRadius: spacing.one,
                    backgroundColor: theme.tint,
                  },
                ]}
              >
                <ThemedText type="smallBold">{liveLabel(details)}</ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.header, { gap: spacing.four }]}>
          {posterUri ? (
            <View
              style={{
                width: posterW,
                height: posterH,
                borderRadius: spacing.two,
                overflow: 'hidden',
                backgroundColor: theme.backgroundElement,
              }}
            >
              <Image
                source={{ uri: posterUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            </View>
          ) : null}

          <View style={[styles.copy, { gap: spacing.two }]}>
            <ThemedText type="title">{details.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {meta}
            </ThemedText>
            {details.liveInfo?.home && details.liveInfo?.away ? (
              <ThemedText type="subtitle">
                {details.liveInfo.home} vs {details.liveInfo.away}
              </ThemedText>
            ) : null}
            {details.liveInfo?.channel ? (
              <ThemedText type="small" themeColor="textSecondary">
                {details.liveInfo.channel}
                {details.liveInfo.league
                  ? ` · ${details.liveInfo.league}`
                  : ''}
              </ThemedText>
            ) : null}
            <ThemedText themeColor="textSecondary">{details.overview}</ThemedText>

            {details.cast.length > 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Cast: {details.cast.map((p) => p.name).join(', ')}
              </ThemedText>
            ) : null}

            <View
              style={[styles.actions, { gap: spacing.three, marginTop: spacing.two }]}
            >
              <ActionButton
                label={playLabel}
                onSelect={onPlay}
                primary
                hasTVPreferredFocus
              />
              <ActionButton label="Back" onSelect={() => router.back()} />
            </View>
          </View>
        </View>

        {seasons.map((season) => (
          <View key={season.number} style={{ gap: spacing.two }}>
            <ThemedText type="subtitle">
              {season.title ?? `Season ${season.number}`}
            </ThemedText>
            {season.episodes.map((ep) => (
              <EpisodeRow key={mediaIdKey(ep.id)} episode={ep} />
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
    </FocusGuide>
  );
}

function EpisodeRow({ episode }: { episode: Episode }) {
  const theme = useTheme();
  const router = useRouter();
  const { spacing } = useScreenDimensions();
  const setMedia = usePlayerStore((s) => s.setMedia);
  const setStatus = usePlayerStore((s) => s.setStatus);

  return (
    <Focusable
      onSelect={() => {
        setMedia(mediaIdKey(episode.id));
        setStatus('loading');
        router.push({
          pathname: '/player',
          params: {
            pluginId: episode.id.pluginId,
            type: episode.id.type,
            providerId: episode.id.providerId,
          },
        });
      }}
      style={({ focused }) => ({
        paddingVertical: spacing.three,
        paddingHorizontal: spacing.four,
        borderRadius: spacing.two,
        borderWidth: 2,
        borderColor: focused ? theme.tint : 'transparent',
        backgroundColor: focused
          ? theme.backgroundSelected
          : theme.backgroundElement,
      })}
    >
      <ThemedText type="smallBold">
        E{episode.number} · {episode.title}
      </ThemedText>
      {episode.overview ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {episode.overview}
        </ThemedText>
      ) : null}
    </Focusable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    paddingBottom: 0,
  },
  hero: {
    overflow: 'hidden',
    width: '100%',
  },
  heroScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  livePill: {
    position: 'absolute',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  copy: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
