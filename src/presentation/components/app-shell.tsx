import { Slot, usePathname, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { FocusGuide } from '@/platform/focus';
import { Sidebar, SidebarItem } from '@/presentation/components/tv/sidebar';
import { useTheme } from '@/presentation/hooks/use-theme';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
  { href: '/library', label: 'Library' },
  { href: '/settings', label: 'Settings' },
  { href: '/tv_focus', label: 'Focus' },
] as const;

function isActiveRoute(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname === '';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Two FocusGuides + autoFocus (standard RN-TV pattern):
 * - Right from sidebar → content guide → first focusable (top-left)
 * - Left from content → sidebar guide → last focused nav row
 * @see https://medium.com/@sofialz/understanding-focus-on-react-native-the-easy-way-d2646b0d2022
 */
export default function AppShell() {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Sidebar>
        {NAV_ITEMS.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          return (
            <SidebarItem
              key={item.href}
              isActive={active}
              onFocusNavigate={() => {
                if (!active) router.replace(item.href);
              }}
            >
              {item.label}
            </SidebarItem>
          );
        })}
      </Sidebar>

      <FocusGuide autoFocus style={styles.content}>
        <Slot />
      </FocusGuide>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
});
