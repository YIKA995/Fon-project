import { Campus, Point, Room, Route, RouteSegment, RouteStep, Waypoint } from '../types';

const STAIRS_CROSSING_COST = 40; // penalizes using stairs vs. a same-floor detour

type GraphNode = {
  id: string;
  floorId: string;
  point: Point;
  /** Present only for room nodes; lets step generation refer to the room by name. */
  roomName?: string;
};

type Graph = {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, { to: string; weight: number }[]>;
};

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function addEdge(graph: Graph, a: string, b: string, weight: number) {
  graph.adjacency.get(a)!.push({ to: b, weight });
  graph.adjacency.get(b)!.push({ to: a, weight });
}

function buildGraph(campus: Campus): Graph {
  const graph: Graph = { nodes: new Map(), adjacency: new Map() };

  const addNode = (node: GraphNode) => {
    graph.nodes.set(node.id, node);
    graph.adjacency.set(node.id, []);
  };

  campus.waypoints.forEach((w) => addNode({ id: w.id, floorId: w.floorId, point: w.point }));
  campus.rooms.forEach((r) =>
    addNode({ id: r.id, floorId: r.floorId, point: r.doorPoint, roomName: r.name })
  );

  const waypointById = new Map<string, Waypoint>(campus.waypoints.map((w) => [w.id, w]));

  campus.edges.forEach((e) => {
    const from = waypointById.get(e.from)!;
    const to = waypointById.get(e.to)!;
    addEdge(graph, e.from, e.to, distance(from.point, to.point));
  });

  campus.rooms.forEach((r) => {
    addEdge(graph, r.id, r.waypointId, distance(r.doorPoint, waypointById.get(r.waypointId)!.point));
  });

  campus.verticalLinks.forEach((link) => {
    for (let i = 0; i < link.waypointIds.length; i++) {
      for (let j = i + 1; j < link.waypointIds.length; j++) {
        addEdge(graph, link.waypointIds[i], link.waypointIds[j], STAIRS_CROSSING_COST);
      }
    }
  });

  return graph;
}

function dijkstra(graph: Graph, sourceId: string, targetId: string): string[] | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const queue = new Set<string>(graph.nodes.keys());

  graph.nodes.forEach((_, id) => dist.set(id, Infinity));
  dist.set(sourceId, 0);

  while (queue.size > 0) {
    let current: string | null = null;
    let currentDist = Infinity;
    for (const id of queue) {
      const d = dist.get(id)!;
      if (d < currentDist) {
        currentDist = d;
        current = id;
      }
    }
    if (current === null || current === targetId) break;

    queue.delete(current);
    visited.add(current);

    for (const { to, weight } of graph.adjacency.get(current) ?? []) {
      if (visited.has(to)) continue;
      const alt = currentDist + weight;
      if (alt < dist.get(to)!) {
        dist.set(to, alt);
        prev.set(to, current);
      }
    }
  }

  if (!prev.has(targetId) && sourceId !== targetId) return null;

  const path: string[] = [targetId];
  let node = targetId;
  while (node !== sourceId) {
    const p = prev.get(node);
    if (!p) return null;
    path.unshift(p);
    node = p;
  }
  return path;
}

function turnLabel(prevPoint: Point, curr: Point, next: Point): 'straight' | 'left' | 'right' {
  const v1 = { x: curr.x - prevPoint.x, y: curr.y - prevPoint.y };
  const v2 = { x: next.x - curr.x, y: next.y - curr.y };
  const cross = v1.x * v2.y - v1.y * v2.x;
  const dot = v1.x * v2.x + v1.y * v2.y;
  const angle = Math.atan2(cross, dot); // radians, + = left turn, - = right turn (screen coords)
  const degrees = (angle * 180) / Math.PI;
  if (Math.abs(degrees) < 25) return 'straight';
  return degrees > 0 ? 'left' : 'right';
}

function buildSteps(campus: Campus, graph: Graph, path: string[]): RouteStep[] {
  const steps: RouteStep[] = [];
  const floorNameById = new Map(campus.floors.map((f) => [f.id, f.name]));

  const nodes = path.map((id) => graph.nodes.get(id)!);
  const startNode = nodes[0];
  const startLabel =
    campus.waypoints.find((w) => w.id === startNode.id)?.label ?? startNode.roomName ?? 'your starting point';

  steps.push({
    instruction: `Start at ${startLabel} on the ${floorNameById.get(startNode.floorId)}.`,
    floorId: startNode.floorId,
  });

  for (let i = 1; i < nodes.length; i++) {
    const prevNode = nodes[i - 1];
    const node = nodes[i];
    const waypoint = campus.waypoints.find((w) => w.id === node.id);
    const isVerticalCrossing = prevNode.floorId !== node.floorId;

    if (isVerticalCrossing) {
      const link = campus.verticalLinks.find(
        (l) => l.waypointIds.includes(prevNode.id) && l.waypointIds.includes(node.id)
      );
      const verb = link?.type === 'elevator' ? 'Take the elevator' : 'Take the stairs';
      steps.push({
        instruction: `${verb} (${link?.label ?? 'nearby'}) up to the ${floorNameById.get(node.floorId)}.`,
        floorId: node.floorId,
      });
      continue;
    }

    if (node.roomName) {
      steps.push({
        instruction: `Arrive at ${node.roomName}, on the ${floorNameById.get(node.floorId)}.`,
        floorId: node.floorId,
      });
      continue;
    }

    // Same-floor hallway movement: describe the turn, if any, at this waypoint.
    if (i < nodes.length - 1) {
      const nextNode = nodes[i + 1];
      if (nextNode.floorId === node.floorId) {
        const turn = turnLabel(prevNode.point, node.point, nextNode.point);
        const at = waypoint?.label ? ` at ${waypoint.label}` : '';
        if (turn === 'straight') {
          steps.push({ instruction: `Continue straight down the hallway${at}.`, floorId: node.floorId });
        } else {
          steps.push({ instruction: `Turn ${turn}${at} and keep walking.`, floorId: node.floorId });
        }
      }
    }
  }

  return steps;
}

function buildSegments(graph: Graph, path: string[]): RouteSegment[] {
  const segments: RouteSegment[] = [];
  let current: RouteSegment | null = null;

  for (const id of path) {
    const node = graph.nodes.get(id)!;
    if (!current || current.floorId !== node.floorId) {
      current = { floorId: node.floorId, points: [] };
      segments.push(current);
    }
    current.points.push(node.point);
  }

  return segments;
}

export function findRoute(campus: Campus, fromId: string, toId: string): Route | null {
  const graph = buildGraph(campus);
  if (!graph.nodes.has(fromId) || !graph.nodes.has(toId)) return null;

  const path = dijkstra(graph, fromId, toId);
  if (!path) return null;

  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    const edges = graph.adjacency.get(path[i - 1]) ?? [];
    const edge = edges.find((e) => e.to === path[i]);
    totalDistance += edge?.weight ?? 0;
  }

  return {
    fromRoomId: fromId,
    toRoomId: toId,
    segments: buildSegments(graph, path),
    steps: buildSteps(campus, graph, path),
    totalDistance,
  };
}

export function findRoomById(campus: Campus, id: string): Room | undefined {
  return campus.rooms.find((r) => r.id === id);
}
