export type Point = { x: number; y: number };

export type RoomCategory =
  | 'office'
  | 'classroom'
  | 'lab'
  | 'restroom'
  | 'hall'
  | 'entrance'
  | 'other';

export type Room = {
  id: string;
  name: string;
  /** Alternate ways people might refer to this room, used for search/AI matching. */
  aliases: string[];
  floorId: string;
  category: RoomCategory;
  /** Rectangle on the floor plan, in plan units (not pixels). */
  rect: { x: number; y: number; width: number; height: number };
  /** Point on the room's threshold, where a route should end/start. */
  doorPoint: Point;
  /** Nearest graph waypoint used for pathfinding. */
  waypointId: string;
  description?: string;
};

export type WaypointType = 'hallway' | 'entrance' | 'stairs' | 'elevator';

export type Waypoint = {
  id: string;
  floorId: string;
  point: Point;
  type: WaypointType;
  label?: string;
};

/** Undirected edge between two waypoints on the SAME floor. */
export type Edge = {
  from: string;
  to: string;
};

/**
 * Vertical link between two waypoints (stairs/elevator) that sit on
 * different floors of the same building, e.g. "Stairs A" on floor 0
 * connects to "Stairs A" on floor 1.
 */
export type VerticalLink = {
  id: string;
  waypointIds: string[]; // one waypoint per floor it touches
  type: 'stairs' | 'elevator';
  label: string;
};

export type Floor = {
  id: string;
  buildingId: string;
  level: number;
  name: string;
  /** Plan size in plan units, used as the SVG viewBox. */
  planWidth: number;
  planHeight: number;
};

export type Building = {
  id: string;
  name: string;
  floorIds: string[];
};

export type Campus = {
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  waypoints: Waypoint[];
  edges: Edge[];
  verticalLinks: VerticalLink[];
};

export type RouteStep = {
  instruction: string;
  floorId: string;
};

export type RouteSegment = {
  floorId: string;
  points: Point[];
};

export type Route = {
  fromRoomId: string;
  toRoomId: string;
  segments: RouteSegment[];
  steps: RouteStep[];
  totalDistance: number;
};
