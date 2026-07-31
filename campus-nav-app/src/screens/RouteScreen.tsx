import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteView } from '../components/RouteView';
import { Room, Route } from '../types';

type Props = {
  route: Route;
  room: Room;
  onBack: () => void;
};

export function RouteScreen({ route, room, onBack }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.back}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{room.name}</Text>
        <View style={{ width: 48 }} />
      </View>
      <RouteView route={route} destinationRoomId={room.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  back: { fontSize: 15, color: '#4f7cff', fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: '#233' },
});
