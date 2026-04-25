/**
 * POI•LOVE — Tab Navigation
 *
 * 3 tab: Mappa (home) · I miei POI · Profilo
 * Icone Phosphor v2.1.1
 */
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants/theme';

// Icone Phosphor via script CDN — su RN usiamo i codepoint Unicode o SVG.
// Qui usiamo emoji come placeholder fino all'integrazione Phosphor RN.
// Sostituire con: import { MapPin, Heart, User } from 'phosphor-react-native'
// dopo: npm install phosphor-react-native

type TabIconProps = { focused: boolean; emoji: string; label: string };

function TabIcon({ focused, emoji, label }: TabIconProps) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>
        {emoji}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarShowLabel: false,
        tabBarStyle:     styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mappa',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="📍" label="Mappa" />
          ),
        }}
      />
      <Tabs.Screen
        name="my-pois"
        options={{
          title: 'I miei POI',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="❤️" label="I miei" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilo',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} emoji="👤" label="Profilo" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:  Colors.background,
    borderTopColor:   Colors.border,
    borderTopWidth:   1,
    height:           72,
    paddingBottom:    12,
    paddingTop:       8,
  },
  tabIcon: {
    alignItems: 'center',
    gap:        2,
  },
  tabEmoji: {
    fontSize: 22,
    opacity:  0.5,
  },
  tabEmojiFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize:   Typography.xs,
    color:      Colors.textMuted,
    fontWeight: Typography.medium,
  },
  tabLabelFocused: {
    color:      Colors.red,
    fontWeight: Typography.bold,
  },
});
