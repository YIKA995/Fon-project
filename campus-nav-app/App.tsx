import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DirectoryScreen } from './src/screens/DirectoryScreen';
import { AssistantScreen } from './src/screens/AssistantScreen';
import { RouteScreen } from './src/screens/RouteScreen';
import { campus, DEFAULT_START_WAYPOINT_ID } from './src/data/campus';
import { findRoute } from './src/lib/pathfinding';
import { Room, Route } from './src/types';

type Tab = 'directory' | 'assistant';

export default function App() {
  const [tab, setTab] = useState<Tab>('directory');
  const [activeRoute, setActiveRoute] = useState<{ route: Route; room: Room } | null>(null);

  const showRouteToRoom = (room: Room) => {
    const route = findRoute(campus, DEFAULT_START_WAYPOINT_ID, room.id);
    if (route) setActiveRoute({ route, room });
  };

  if (activeRoute) {
    return (
      <SafeAreaView style={styles.safe}>
        <RouteScreen route={activeRoute.route} room={activeRoute.room} onBack={() => setActiveRoute(null)} />
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {tab === 'directory' ? (
          <DirectoryScreen onSelectRoom={showRouteToRoom} />
        ) : (
          <AssistantScreen onShowRoute={(route, room) => setActiveRoute({ route, room })} />
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabButton} onPress={() => setTab('directory')}>
          <Text style={[styles.tabLabel, tab === 'directory' && styles.tabLabelActive]}>Directory</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabButton} onPress={() => setTab('assistant')}>
          <Text style={[styles.tabLabel, tab === 'assistant' && styles.tabLabelActive]}>Ask AI</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eef1f8',
  },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabLabel: { fontSize: 14, fontWeight: '600', color: '#99a' },
  tabLabelActive: { color: '#4f7cff' },
});
