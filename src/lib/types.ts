export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Field {
  id: string;
  name: string;
  boundaries: GeoPoint[];
  acreage: number;
  cropType: string;
  plantingDate: string;
  seasonId: string;
  healthScore: number; // 0-100
  healthStatus: 'healthy' | 'watch' | 'critical';
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  fieldId: string;
  date: string;
  droneModel: string;
  altitude: number;
  imageCount: number;
  sensorType: 'rgb' | 'multispectral';
  weather: string;
  notes: string;
  createdAt: string;
}

export interface DroneImage {
  id: string;
  flightId: string;
  filename: string;
  gpsLat: number;
  gpsLng: number;
  altitude: number;
  sensorType: 'rgb' | 'multispectral';
  capturedAt: string;
  processedAt?: string;
}

export interface HealthZone {
  id: string;
  polygon: GeoPoint[];
  avgValue: number;
  classification: 'healthy' | 'moderate' | 'stressed' | 'critical';
  areaAcres: number;
  stressType?: string;
}

export interface HealthMap {
  id: string;
  flightId: string;
  fieldId: string;
  indexType: 'vari' | 'exg' | 'gli' | 'ndvi' | 'ndre' | 'savi';
  zones: HealthZone[];
  overallScore: number;
  generatedAt: string;
}

export interface Alert {
  id: string;
  fieldId: string;
  flightId: string;
  zoneId: string;
  severity: 'watch' | 'critical';
  stressType: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalFields: number;
  totalFlights: number;
  totalAcres: number;
  healthyFields: number;
  watchFields: number;
  criticalFields: number;
  recentAlerts: Alert[];
}
