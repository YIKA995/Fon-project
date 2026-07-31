import { Campus } from '../types';

/**
 * Placeholder data for one demo building ("Block A", 2 floors).
 * This proves out the data model end-to-end. Swap this file for real
 * Bamenda campus buildings/floors/rooms once floor plans are available —
 * nothing else in the app needs to change.
 */
export const campus: Campus = {
  buildings: [{ id: 'block-a', name: 'Block A', floorIds: ['floor-ground', 'floor-1'] }],

  floors: [
    { id: 'floor-ground', buildingId: 'block-a', level: 0, name: 'Ground Floor', planWidth: 400, planHeight: 260 },
    { id: 'floor-1', buildingId: 'block-a', level: 1, name: 'First Floor', planWidth: 400, planHeight: 260 },
  ],

  waypoints: [
    // Ground floor
    { id: 'ENT_G', floorId: 'floor-ground', point: { x: 200, y: 240 }, type: 'entrance', label: 'Main Entrance' },
    { id: 'J_G', floorId: 'floor-ground', point: { x: 200, y: 150 }, type: 'hallway' },
    { id: 'W_G', floorId: 'floor-ground', point: { x: 80, y: 150 }, type: 'hallway' },
    { id: 'E_G', floorId: 'floor-ground', point: { x: 330, y: 150 }, type: 'hallway' },
    { id: 'STAIRS_G', floorId: 'floor-ground', point: { x: 330, y: 70 }, type: 'stairs', label: 'Stairs A' },
    // First floor
    { id: 'STAIRS_1', floorId: 'floor-1', point: { x: 330, y: 70 }, type: 'stairs', label: 'Stairs A' },
    { id: 'E_1', floorId: 'floor-1', point: { x: 330, y: 150 }, type: 'hallway' },
    { id: 'J_1', floorId: 'floor-1', point: { x: 200, y: 150 }, type: 'hallway' },
    { id: 'W_1', floorId: 'floor-1', point: { x: 80, y: 150 }, type: 'hallway' },
  ],

  edges: [
    // Ground floor corridor
    { from: 'ENT_G', to: 'J_G' },
    { from: 'J_G', to: 'W_G' },
    { from: 'J_G', to: 'E_G' },
    { from: 'E_G', to: 'STAIRS_G' },
    // First floor corridor
    { from: 'STAIRS_1', to: 'E_1' },
    { from: 'E_1', to: 'J_1' },
    { from: 'J_1', to: 'W_1' },
  ],

  verticalLinks: [
    { id: 'stairs-a', waypointIds: ['STAIRS_G', 'STAIRS_1'], type: 'stairs', label: 'Stairs A' },
  ],

  rooms: [
    // Ground floor
    {
      id: 'r-registrar',
      name: "Registrar's Office",
      aliases: ['registrar', 'admissions', 'room 101', '101'],
      floorId: 'floor-ground',
      category: 'office',
      rect: { x: 20, y: 20, width: 120, height: 90 },
      doorPoint: { x: 80, y: 110 },
      waypointId: 'W_G',
      description: 'Student records, admissions and transcripts.',
    },
    {
      id: 'r-bursary',
      name: 'Bursary',
      aliases: ['bursary', 'finance office', 'fees office', 'room 102', '102'],
      floorId: 'floor-ground',
      category: 'office',
      rect: { x: 150, y: 20, width: 100, height: 90 },
      doorPoint: { x: 200, y: 110 },
      waypointId: 'J_G',
      description: 'Tuition payments and fee clearance.',
    },
    {
      id: 'r-restroom-g',
      name: 'Restrooms',
      aliases: ['restroom', 'toilet', 'bathroom', 'wc', 'ground floor restroom'],
      floorId: 'floor-ground',
      category: 'restroom',
      rect: { x: 270, y: 20, width: 110, height: 60 },
      doorPoint: { x: 325, y: 80 },
      waypointId: 'E_G',
    },
    {
      id: 'r-server',
      name: 'Server Room',
      aliases: ['server room', 'it closet', 'network room', 'room 104', '104'],
      floorId: 'floor-ground',
      category: 'other',
      rect: { x: 270, y: 90, width: 110, height: 50 },
      doorPoint: { x: 325, y: 90 },
      waypointId: 'E_G',
    },
    // First floor
    {
      id: 'r-dean',
      name: "Dean's Office",
      aliases: ['dean', "dean's office", 'room 201', '201'],
      floorId: 'floor-1',
      category: 'office',
      rect: { x: 20, y: 20, width: 120, height: 90 },
      doorPoint: { x: 80, y: 110 },
      waypointId: 'W_1',
    },
    {
      id: 'r-exams',
      name: 'Exams Office',
      aliases: ['exams', 'examinations office', 'room 202', '202'],
      floorId: 'floor-1',
      category: 'office',
      rect: { x: 150, y: 20, width: 100, height: 90 },
      doorPoint: { x: 200, y: 110 },
      waypointId: 'J_1',
    },
    {
      id: 'r-it',
      name: 'IT Office',
      aliases: ['it office', 'ict office', 'computer support', 'room 203', '203'],
      floorId: 'floor-1',
      category: 'office',
      rect: { x: 270, y: 20, width: 110, height: 60 },
      doorPoint: { x: 325, y: 80 },
      waypointId: 'E_1',
    },
    {
      id: 'r-library',
      name: 'Library Annex',
      aliases: ['library', 'reading room', 'room 204', '204'],
      floorId: 'floor-1',
      category: 'other',
      rect: { x: 270, y: 90, width: 110, height: 50 },
      doorPoint: { x: 325, y: 90 },
      waypointId: 'E_1',
    },
  ],
};

export const DEFAULT_START_WAYPOINT_ID = 'ENT_G';
