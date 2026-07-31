import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { Floor, Point, Room } from '../types';

type Props = {
  floor: Floor;
  rooms: Room[];
  /** Route points on this floor, in plan units, already ordered start-to-end. */
  pathPoints?: Point[];
  highlightRoomId?: string | null;
  startPoint?: Point | null;
};

const ROOM_FILL = '#dbe7ff';
const ROOM_FILL_HIGHLIGHT = '#4f7cff';
const ROOM_STROKE = '#7c93c9';

export function FloorPlanView({ floor, rooms, pathPoints, highlightRoomId, startPoint }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.floorLabel}>{floor.name}</Text>
      <Svg
        width="100%"
        height={280}
        viewBox={`0 0 ${floor.planWidth} ${floor.planHeight}`}
        style={styles.svg}
      >
        {rooms.map((room) => {
          const isHighlighted = room.id === highlightRoomId;
          return (
            <React.Fragment key={room.id}>
              <Rect
                x={room.rect.x}
                y={room.rect.y}
                width={room.rect.width}
                height={room.rect.height}
                fill={isHighlighted ? ROOM_FILL_HIGHLIGHT : ROOM_FILL}
                stroke={ROOM_STROKE}
                strokeWidth={1.5}
                rx={4}
              />
              <SvgText
                x={room.rect.x + room.rect.width / 2}
                y={room.rect.y + room.rect.height / 2}
                fontSize={11}
                fill={isHighlighted ? '#ffffff' : '#233'}
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {room.name}
              </SvgText>
            </React.Fragment>
          );
        })}

        {pathPoints && pathPoints.length > 1 && (
          <Polyline
            points={pathPoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#ff8a3d"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {startPoint && <Circle cx={startPoint.x} cy={startPoint.y} r={7} fill="#2ecc71" stroke="#1a8a4c" strokeWidth={2} />}

        {pathPoints && pathPoints.length > 0 && (
          <Circle
            cx={pathPoints[pathPoints.length - 1].x}
            cy={pathPoints[pathPoints.length - 1].y}
            r={7}
            fill="#ff3b30"
            stroke="#a3241d"
            strokeWidth={2}
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  floorLabel: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
    color: '#233',
  },
  svg: {
    backgroundColor: '#f5f7fb',
    borderRadius: 8,
  },
});
