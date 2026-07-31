import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { campus } from '../data/campus';
import { searchRooms } from '../lib/assistant';
import { Room } from '../types';

type Props = {
  onSelectRoom: (room: Room) => void;
};

export function DirectoryScreen({ onSelectRoom }: Props) {
  const [query, setQuery] = useState('');

  const rooms = useMemo(() => {
    if (!query.trim()) return campus.rooms.map((room) => ({ room, score: 1 }));
    return searchRooms(campus, query);
  }, [query]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Block A Directory</Text>
      <Text style={styles.subtitle}>Search any office, room number, or facility</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Registrar, room 203, restroom..."
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.room.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => onSelectRoom(item.room)}>
            <View>
              <Text style={styles.roomName}>{item.room.name}</Text>
              {item.room.description ? <Text style={styles.roomDesc}>{item.room.description}</Text> : null}
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No rooms match "{query}".</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#233' },
  subtitle: { fontSize: 13, color: '#667', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#d6dceb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f8',
  },
  roomName: { fontSize: 16, fontWeight: '600', color: '#233' },
  roomDesc: { fontSize: 12, color: '#778', marginTop: 2 },
  chevron: { fontSize: 18, color: '#aab' },
  empty: { textAlign: 'center', marginTop: 40, color: '#889' },
});
