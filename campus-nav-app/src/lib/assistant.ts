import { Campus, Room, Route } from '../types';
import { DEFAULT_START_WAYPOINT_ID } from '../data/campus';
import { findRoute } from './pathfinding';

/** Levenshtein edit distance, used to tolerate typos in free-text queries. */
function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/['".,?!]/g, '').trim();
}

function scoreCandidate(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  if (c === q) return 1;
  // Substring shortcuts are only meaningful once the query has enough
  // characters that a match couldn't just be a stray short word (e.g. "to"
  // is a substring of "restrooms" but obviously isn't naming that room).
  if (q.length >= 3 && (c.includes(q) || q.includes(c))) return 0.85;
  const dist = editDistance(q, c);
  const maxLen = Math.max(q.length, c.length);
  return Math.max(0, 1 - dist / maxLen);
}

export type RoomMatch = { room: Room; score: number };

/** Ranks every room in the directory against free-text, best match first. */
export function searchRooms(campus: Campus, query: string): RoomMatch[] {
  const results: RoomMatch[] = campus.rooms.map((room) => {
    const candidates = [room.name, ...room.aliases];
    const best = Math.max(...candidates.map((c) => scoreCandidate(query, c)));
    return { room, score: best };
  });
  return results.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
}

/**
 * Extracts the most likely destination room from a free-text question like
 * "how do I get to the registrar's office?" by scoring every word/phrase
 * window in the query against the room directory, rather than requiring an
 * exact room name.
 */
function bestRoomInQuery(campus: Campus, query: string): RoomMatch | null {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  let best: RoomMatch | null = null;

  for (let start = 0; start < words.length; start++) {
    for (let len = 1; len <= 5 && start + len <= words.length; len++) {
      const window = words.slice(start, start + len).join(' ');
      if (window.length < 3) continue; // skip short filler words like "to"/"me"
      for (const match of searchRooms(campus, window)) {
        if (!best || match.score > best.score) best = match;
      }
    }
  }

  return best && best.score >= 0.6 ? best : null;
}

export type AssistantAnswer = {
  text: string;
  route: Route | null;
  room: Room | null;
  suggestions: Room[];
};

export function answerQuery(campus: Campus, query: string, startWaypointId: string = DEFAULT_START_WAYPOINT_ID): AssistantAnswer {
  const match = bestRoomInQuery(campus, query);

  if (!match) {
    const suggestions = campus.rooms.slice(0, 4);
    return {
      text:
        "I couldn't find that office or room in Block A's directory. Try the exact name, or a room number — for example \"registrar\" or \"room 203\".",
      route: null,
      room: null,
      suggestions,
    };
  }

  const route = findRoute(campus, startWaypointId, match.room.id);
  if (!route) {
    return {
      text: `I found ${match.room.name}, but couldn't work out a walking route to it right now.`,
      route: null,
      room: match.room,
      suggestions: [],
    };
  }

  const floors = new Set(route.segments.map((s) => s.floorId));
  const floorNote =
    floors.size > 1
      ? ` It's a ${floors.size}-floor walk.`
      : '';

  return {
    text: `Here's how to get to ${match.room.name} from the Main Entrance.${floorNote}`,
    route,
    room: match.room,
    suggestions: [],
  };
}
