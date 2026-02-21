import { Field, Flight, HealthMap, Alert, DashboardStats, AnalysisResult } from './types';
import { SEED_FIELDS, SEED_FLIGHTS, SEED_HEALTH_MAPS, SEED_ALERTS } from './seed-data';

// In-memory store (resets on server restart, but sufficient for MVP)
let fields: Field[] = [...SEED_FIELDS];
let flights: Flight[] = [...SEED_FLIGHTS];
let healthMaps: HealthMap[] = [...SEED_HEALTH_MAPS];
let alerts: Alert[] = [...SEED_ALERTS];
let analysisResults: AnalysisResult[] = [];

export function getFields(): Field[] {
  return fields;
}

export function getField(id: string): Field | undefined {
  return fields.find(f => f.id === id);
}

export function addField(field: Field): Field {
  fields.push(field);
  return field;
}

export function getFlights(fieldId?: string): Flight[] {
  if (fieldId) return flights.filter(f => f.fieldId === fieldId);
  return flights;
}

export function getFlight(id: string): Flight | undefined {
  return flights.find(f => f.id === id);
}

export function addFlight(flight: Flight): Flight {
  flights.push(flight);
  return flight;
}

export function getHealthMaps(fieldId?: string, flightId?: string): HealthMap[] {
  let result = healthMaps;
  if (fieldId) result = result.filter(h => h.fieldId === fieldId);
  if (flightId) result = result.filter(h => h.flightId === flightId);
  return result;
}

export function getHealthMap(id: string): HealthMap | undefined {
  return healthMaps.find(h => h.id === id);
}

export function addHealthMap(hm: HealthMap): HealthMap {
  healthMaps.push(hm);
  return hm;
}

export function getAnalysisResults(): AnalysisResult[] {
  return analysisResults;
}

export function getAnalysisResult(id: string): AnalysisResult | undefined {
  return analysisResults.find(result => result.id === id);
}

export function addAnalysisResult(result: AnalysisResult): AnalysisResult {
  analysisResults.push(result);
  return result;
}

export function getAlerts(fieldId?: string): Alert[] {
  if (fieldId) return alerts.filter(a => a.fieldId === fieldId);
  return alerts;
}

export function getDashboardStats(): DashboardStats {
  const totalAcres = fields.reduce((sum, f) => sum + f.acreage, 0);
  return {
    totalFields: fields.length,
    totalFlights: flights.length,
    totalAcres,
    healthyFields: fields.filter(f => f.healthStatus === 'healthy').length,
    watchFields: fields.filter(f => f.healthStatus === 'watch').length,
    criticalFields: fields.filter(f => f.healthStatus === 'critical').length,
    recentAlerts: alerts.filter(a => !a.acknowledged).slice(-5),
  };
}

export function resetStore(): void {
  fields = [...SEED_FIELDS];
  flights = [...SEED_FLIGHTS];
  healthMaps = [...SEED_HEALTH_MAPS];
  alerts = [...SEED_ALERTS];
  analysisResults = [];
}
