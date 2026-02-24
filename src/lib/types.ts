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

export interface Detection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  detections: Detection[];
  healthScore: number;
  timestamp: string;
}

// Prescription Pipeline Types
export interface PrescriptionIssue {
  class: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedAcres: number;
  description: string;
  detectionCount: number;
  avgConfidence: number;
}

export interface PrescriptionAction {
  action: string;
  product: string;
  rate: string;
  timing: string;
  estimatedCostPerAcre: number;
  priority: number;
  zone: string;
}

export interface YieldImpact {
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  estimatedLossPerAcre: number;
  preventionWindow: string;
  totalEstimatedLoss: number;
}

export interface Prescription {
  summary: string;
  overallHealthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: PrescriptionIssue[];
  prescriptions: PrescriptionAction[];
  yieldImpact: YieldImpact;
  totalEstimatedCost: number;
  generatedAt: string;
}
