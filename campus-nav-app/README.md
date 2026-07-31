# Campus Nav — Bamenda Campus AI Navigator (MVP)

An AI-assisted mobile app that guides students and visitors to any office,
classroom, or door on campus — search a directory or just ask in plain
English ("how do I get to the registrar's office?") and get a highlighted
route on the floor plan plus step-by-step directions.

## Why this approach

True real-time indoor GPS ("blue dot") tracking needs BLE beacons or WiFi
positioning hardware installed in every building — a real budget and
facilities-access project. This MVP instead ships something usable
immediately: a searchable office directory, floor-plan maps with the route
drawn on them, and an AI assistant that turns free-text questions into
routes using the same pathfinding engine. It's the fastest path to
something students can actually use, and the data model is designed so
real indoor positioning (or AR wayfinding) can be layered on later without
a rewrite.

## Status: placeholder data

`src/data/campus.ts` currently describes one **fictional building ("Block
A", 2 floors, 8 rooms)**, not the real University of Bamenda campus. This
proves the whole system end-to-end — search, AI query parsing, multi-floor
pathfinding (including stairs), and route rendering — with data that's
easy to reason about. **Next real step:** replace `campus.ts` with the
actual Bamenda campus buildings/floors/rooms (see "Adding real campus
data" below). Nothing else in the app needs to change.

## How it works

- **`src/types.ts`** — the data model: `Building` → `Floor` → `Room`, plus
  a `Waypoint`/`Edge` graph representing hallways, and `VerticalLink` for
  stairs/elevators connecting floors.
- **`src/lib/pathfinding.ts`** — builds a graph from the campus data
  (rooms attach to their nearest hallway waypoint) and runs Dijkstra's
  algorithm to find the shortest route between any two rooms, including
  across floors. It also turns the raw path into natural turn-by-turn
  instructions ("turn left", "take the stairs up to the First Floor",
  "arrive at Dean's Office") by computing the turn angle at each waypoint.
- **`src/lib/assistant.ts`** — the "AI" layer. It takes free-text like
  *"how do I get to the registrers office"* (typo included), fuzzy-matches
  it against every room name/alias in the directory using edit-distance
  scoring, and calls the pathfinder to generate an answer. Nonsense
  queries ("take me to the moon") are correctly rejected rather than
  guessing.
- **`src/components/FloorPlanView.tsx`** — renders a floor as SVG (rooms as
  labeled rectangles, the route as a highlighted line, start/end pins).
  No floor-plan image is required — this works from the coordinate data
  alone, though it can also work as an overlay on a real scanned floor
  plan image later.
- **`src/screens/`** — `DirectoryScreen` (search/browse), `AssistantScreen`
  (chat-style Q&A), `RouteScreen` (map + directions for a chosen room).

## Running it

```bash
npm install
npx expo start        # scan the QR code with Expo Go on your phone
# or
npm run android / npm run ios
```

## Adding real campus data

To go from the placeholder building to the real campus:

1. Get (or create) floor-plan layouts for each building — even a rough
   sketch with approximate room positions is enough to start.
2. In `src/data/campus.ts`, add each `Building`/`Floor`, then each `Room`
   with a bounding box (`rect`) and a `doorPoint` in plan coordinates.
3. Add `Waypoint`s along hallways and `Edge`s connecting them, and connect
   each room to its nearest waypoint.
4. Add `VerticalLink`s for real stairwells/elevators connecting floors.
5. Everything else — search, the AI assistant, pathfinding, and the map
   UI — works automatically against the new data.

For a real deployment, floor-plan images (scanned/drawn) can be added as a
background image in `FloorPlanView` instead of the current abstract SVG
boxes, and a "current location" flow (QR codes at each entrance/floor, or
BLE beacons later) can replace the fixed "Main Entrance" starting point.
