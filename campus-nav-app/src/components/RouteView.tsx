import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { campus } from '../data/campus';
import { Route } from '../types';
import { FloorPlanView } from './FloorPlanView';

type Props = {
  route: Route;
  destinationRoomId: string;
};

export function RouteView({ route, destinationRoomId }: Props) {
  return (
    <ScrollView>
      {route.segments.map((segment, index) => {
        const floor = campus.floors.find((f) => f.id === segment.floorId)!;
        const roomsOnFloor = campus.rooms.filter((r) => r.floorId === segment.floorId);
        const isFirstSegment = index === 0;
        return (
          <FloorPlanView
            key={`${segment.floorId}-${index}`}
            floor={floor}
            rooms={roomsOnFloor}
            pathPoints={segment.points}
            highlightRoomId={destinationRoomId}
            startPoint={isFirstSegment ? segment.points[0] : null}
          />
        );
      })}

      <View style={styles.steps}>
        <Text style={styles.stepsTitle}>Directions</Text>
        {route.steps.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <Text style={styles.stepIndex}>{index + 1}</Text>
            <Text style={styles.stepText}>{step.instruction}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  steps: {
    marginTop: 8,
    paddingBottom: 24,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#233',
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  stepIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4f7cff',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    marginRight: 8,
    overflow: 'hidden',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#233',
    lineHeight: 20,
  },
});
