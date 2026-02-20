import { Field, Flight, HealthMap, HealthZone, Alert } from './types';

export const SEED_FIELDS: Field[] = [
  {
    id: 'field-001',
    name: 'Temple North — Corn',
    boundaries: [
      { lat: 31.1120, lng: -97.3500 },
      { lat: 31.1120, lng: -97.3400 },
      { lat: 31.1050, lng: -97.3400 },
      { lat: 31.1050, lng: -97.3500 },
    ],
    acreage: 480,
    cropType: 'Corn',
    plantingDate: '2026-03-15',
    seasonId: '2026-spring',
    healthScore: 78,
    healthStatus: 'watch',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-02-18T14:30:00Z',
  },
  {
    id: 'field-002',
    name: 'Lubbock West — Cotton',
    boundaries: [
      { lat: 33.5500, lng: -101.8700 },
      { lat: 33.5500, lng: -101.8550 },
      { lat: 33.5400, lng: -101.8550 },
      { lat: 33.5400, lng: -101.8700 },
    ],
    acreage: 640,
    cropType: 'Cotton',
    plantingDate: '2026-04-01',
    seasonId: '2026-spring',
    healthScore: 92,
    healthStatus: 'healthy',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-02-17T16:00:00Z',
  },
  {
    id: 'field-003',
    name: 'Corpus Christi South — Sorghum',
    boundaries: [
      { lat: 27.7500, lng: -97.4100 },
      { lat: 27.7500, lng: -97.3950 },
      { lat: 27.7400, lng: -97.3950 },
      { lat: 27.7400, lng: -97.4100 },
    ],
    acreage: 320,
    cropType: 'Sorghum',
    plantingDate: '2026-03-01',
    seasonId: '2026-spring',
    healthScore: 45,
    healthStatus: 'critical',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-19T11:00:00Z',
  },
];

export const SEED_FLIGHTS: Flight[] = [
  // Temple corn flights
  {
    id: 'flight-001',
    fieldId: 'field-001',
    date: '2026-02-01',
    droneModel: 'DJI Mavic 3 Multispectral',
    altitude: 120,
    imageCount: 245,
    sensorType: 'rgb',
    weather: 'Clear, 72°F, 8mph NW',
    notes: 'Early season baseline scan',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'flight-002',
    fieldId: 'field-001',
    date: '2026-02-10',
    droneModel: 'DJI Mavic 3 Multispectral',
    altitude: 120,
    imageCount: 252,
    sensorType: 'rgb',
    weather: 'Partly cloudy, 68°F, 12mph S',
    notes: 'Follow-up — NE corner stress detected',
    createdAt: '2026-02-10T09:30:00Z',
  },
  {
    id: 'flight-003',
    fieldId: 'field-001',
    date: '2026-02-18',
    droneModel: 'DJI Mavic 3 Multispectral',
    altitude: 120,
    imageCount: 248,
    sensorType: 'rgb',
    weather: 'Clear, 75°F, 5mph E',
    notes: 'Weekly check — irrigation adjusted',
    createdAt: '2026-02-18T10:15:00Z',
  },
  // Lubbock cotton flights
  {
    id: 'flight-004',
    fieldId: 'field-002',
    date: '2026-02-05',
    droneModel: 'DJI Matrice 350 RTK',
    altitude: 150,
    imageCount: 380,
    sensorType: 'rgb',
    weather: 'Clear, 65°F, 15mph W',
    notes: 'Pre-season soil assessment',
    createdAt: '2026-02-05T08:00:00Z',
  },
  {
    id: 'flight-005',
    fieldId: 'field-002',
    date: '2026-02-15',
    droneModel: 'DJI Matrice 350 RTK',
    altitude: 150,
    imageCount: 392,
    sensorType: 'rgb',
    weather: 'Clear, 70°F, 10mph NW',
    notes: 'Early growth check — looking good',
    createdAt: '2026-02-15T08:30:00Z',
  },
  // Corpus sorghum flights
  {
    id: 'flight-006',
    fieldId: 'field-003',
    date: '2026-02-03',
    droneModel: 'DJI Mini 4 Pro',
    altitude: 100,
    imageCount: 156,
    sensorType: 'rgb',
    weather: 'Humid, 78°F, 6mph SE',
    notes: 'Baseline scan',
    createdAt: '2026-02-03T11:00:00Z',
  },
  {
    id: 'flight-007',
    fieldId: 'field-003',
    date: '2026-02-12',
    droneModel: 'DJI Mini 4 Pro',
    altitude: 100,
    imageCount: 162,
    sensorType: 'rgb',
    weather: 'Overcast, 74°F, 8mph E',
    notes: 'Stress visible — possible pest damage south section',
    createdAt: '2026-02-12T10:45:00Z',
  },
  {
    id: 'flight-008',
    fieldId: 'field-003',
    date: '2026-02-19',
    droneModel: 'DJI Mini 4 Pro',
    altitude: 100,
    imageCount: 168,
    sensorType: 'rgb',
    weather: 'Clear, 82°F, 4mph S',
    notes: 'Critical — widespread stress confirmed',
    createdAt: '2026-02-19T09:00:00Z',
  },
];

function makeZones(fieldId: string, flightId: string): HealthZone[] {
  const field = SEED_FIELDS.find(f => f.id === fieldId)!;
  const b = field.boundaries;
  const midLat = (b[0].lat + b[2].lat) / 2;
  const midLng = (b[0].lng + b[2].lng) / 2;

  if (fieldId === 'field-003') {
    return [
      { id: `${flightId}-z1`, polygon: [b[0], { lat: b[0].lat, lng: midLng }, { lat: midLat, lng: midLng }, { lat: midLat, lng: b[0].lng }], avgValue: 0.35, classification: 'critical', areaAcres: 80, stressType: 'Pest damage' },
      { id: `${flightId}-z2`, polygon: [{ lat: b[0].lat, lng: midLng }, b[1], { lat: midLat, lng: b[1].lng }, { lat: midLat, lng: midLng }], avgValue: 0.52, classification: 'stressed', areaAcres: 80, stressType: 'Water stress' },
      { id: `${flightId}-z3`, polygon: [{ lat: midLat, lng: b[0].lng }, { lat: midLat, lng: midLng }, { lat: b[2].lat, lng: midLng }, b[3]], avgValue: 0.48, classification: 'stressed', areaAcres: 80, stressType: 'Nutrient deficiency' },
      { id: `${flightId}-z4`, polygon: [{ lat: midLat, lng: midLng }, { lat: midLat, lng: b[1].lng }, b[2], { lat: b[2].lat, lng: midLng }], avgValue: 0.30, classification: 'critical', areaAcres: 80, stressType: 'Pest damage' },
    ];
  }
  if (fieldId === 'field-001') {
    return [
      { id: `${flightId}-z1`, polygon: [b[0], { lat: b[0].lat, lng: midLng }, { lat: midLat, lng: midLng }, { lat: midLat, lng: b[0].lng }], avgValue: 0.72, classification: 'moderate', areaAcres: 120, stressType: 'Water stress' },
      { id: `${flightId}-z2`, polygon: [{ lat: b[0].lat, lng: midLng }, b[1], { lat: midLat, lng: b[1].lng }, { lat: midLat, lng: midLng }], avgValue: 0.55, classification: 'stressed', areaAcres: 120, stressType: 'Water stress' },
      { id: `${flightId}-z3`, polygon: [{ lat: midLat, lng: b[0].lng }, { lat: midLat, lng: midLng }, { lat: b[2].lat, lng: midLng }, b[3]], avgValue: 0.85, classification: 'healthy', areaAcres: 120 },
      { id: `${flightId}-z4`, polygon: [{ lat: midLat, lng: midLng }, { lat: midLat, lng: b[1].lng }, b[2], { lat: b[2].lat, lng: midLng }], avgValue: 0.82, classification: 'healthy', areaAcres: 120 },
    ];
  }
  // Lubbock cotton — mostly healthy
  return [
    { id: `${flightId}-z1`, polygon: [b[0], { lat: b[0].lat, lng: midLng }, { lat: midLat, lng: midLng }, { lat: midLat, lng: b[0].lng }], avgValue: 0.88, classification: 'healthy', areaAcres: 160 },
    { id: `${flightId}-z2`, polygon: [{ lat: b[0].lat, lng: midLng }, b[1], { lat: midLat, lng: b[1].lng }, { lat: midLat, lng: midLng }], avgValue: 0.91, classification: 'healthy', areaAcres: 160 },
    { id: `${flightId}-z3`, polygon: [{ lat: midLat, lng: b[0].lng }, { lat: midLat, lng: midLng }, { lat: b[2].lat, lng: midLng }, b[3]], avgValue: 0.86, classification: 'healthy', areaAcres: 160 },
    { id: `${flightId}-z4`, polygon: [{ lat: midLat, lng: midLng }, { lat: midLat, lng: b[1].lng }, b[2], { lat: b[2].lat, lng: midLng }], avgValue: 0.93, classification: 'healthy', areaAcres: 160 },
  ];
}

export const SEED_HEALTH_MAPS: HealthMap[] = SEED_FLIGHTS.map(f => ({
  id: `hm-${f.id}`,
  flightId: f.id,
  fieldId: f.fieldId,
  indexType: 'vari' as const,
  zones: makeZones(f.fieldId, f.id),
  overallScore: SEED_FIELDS.find(field => field.id === f.fieldId)!.healthScore,
  generatedAt: f.createdAt,
}));

export const SEED_ALERTS: Alert[] = [
  {
    id: 'alert-001',
    fieldId: 'field-001',
    flightId: 'flight-002',
    zoneId: 'flight-002-z2',
    severity: 'watch',
    stressType: 'Water stress',
    message: 'NE quadrant showing 15% VARI decline — check irrigation line pressure',
    acknowledged: false,
    createdAt: '2026-02-10T12:00:00Z',
  },
  {
    id: 'alert-002',
    fieldId: 'field-003',
    flightId: 'flight-007',
    zoneId: 'flight-007-z1',
    severity: 'critical',
    stressType: 'Pest damage',
    message: 'NW quadrant VARI dropped to 0.35 — suspected sugarcane aphid infestation',
    acknowledged: false,
    createdAt: '2026-02-12T13:00:00Z',
  },
  {
    id: 'alert-003',
    fieldId: 'field-003',
    flightId: 'flight-008',
    zoneId: 'flight-008-z4',
    severity: 'critical',
    stressType: 'Pest damage',
    message: 'SE quadrant now critical (0.30) — pest damage spreading, immediate action needed',
    acknowledged: false,
    createdAt: '2026-02-19T12:00:00Z',
  },
  {
    id: 'alert-004',
    fieldId: 'field-003',
    flightId: 'flight-008',
    zoneId: 'flight-008-z3',
    severity: 'watch',
    stressType: 'Nutrient deficiency',
    message: 'SW quadrant showing nutrient deficiency pattern — consider soil test',
    acknowledged: false,
    createdAt: '2026-02-19T12:05:00Z',
  },
];
