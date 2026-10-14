/**
 * Mock Field Sales Data Fixtures for Sparks Field Sales — Internal Dashboard
 * 
 * STRICT COMPLIANCE NOTE:
 * - This file contains mock/sample data exclusively for scaffold testing.
 * - Under NO circumstances does it include customer PII (e.g. parent names, phone numbers,
 *   child names, dates of birth, or addresses).
 * - All metrics are sample aggregates for development verification prior to Apps Script audit.
 */

import { LocationPerformanceRecord, EcPerformanceRecord, PipelineAuditRecord } from '../types/dashboard';

export const MOCK_DATA_METADATA = {
  isMock: true,
  environment: 'development_scaffold',
  dataSource: 'MOCK_FIXTURE_V1 (Apps Script audit pending)',
  generatedAt: '2026-10-14T00:00:00Z',
  piiFreeCertified: true,
};

export const MOCK_CENTERS = [
  'Jakarta Central',
  'Jakarta South',
  'Surabaya West',
  'Bandung East',
  'Medan North',
] as const;

export const MOCK_LOCATIONS: LocationPerformanceRecord[] = [
  {
    locationId: 'LOC-JKT-01',
    locationName: 'Grand Indonesia - Level 3 Booth A',
    center: 'Jakarta Central',
    region: 'DKI Jakarta',
    totalLeads: 342,
    totalBookings: 88,
    conversionRate: 25.7,
    activeEcsCount: 4,
    status: 'active',
  },
  {
    locationId: 'LOC-JKT-02',
    locationName: 'Central Park Mall - Promenade Atrium',
    center: 'Jakarta Central',
    region: 'DKI Jakarta',
    totalLeads: 295,
    totalBookings: 74,
    conversionRate: 25.1,
    activeEcsCount: 3,
    status: 'active',
  },
  {
    locationId: 'LOC-JKT-03',
    locationName: 'Pondok Indah Mall 2 - South Wing',
    center: 'Jakarta South',
    region: 'DKI Jakarta',
    totalLeads: 418,
    totalBookings: 114,
    conversionRate: 27.3,
    activeEcsCount: 5,
    status: 'active',
  },
  {
    locationId: 'LOC-SBY-01',
    locationName: 'Pakuwon Mall - Grand Atrium Fl 1',
    center: 'Surabaya West',
    region: 'East Java',
    totalLeads: 260,
    totalBookings: 59,
    conversionRate: 22.7,
    activeEcsCount: 3,
    status: 'active',
  },
  {
    locationId: 'LOC-BDG-01',
    locationName: 'Paris Van Java - Concourse Level',
    center: 'Bandung East',
    region: 'West Java',
    totalLeads: 198,
    totalBookings: 43,
    conversionRate: 21.7,
    activeEcsCount: 2,
    status: 'active',
  },
  {
    locationId: 'LOC-MDN-01',
    locationName: 'Sun Plaza - Ground Floor Hub',
    center: 'Medan North',
    region: 'North Sumatra',
    totalLeads: 165,
    totalBookings: 32,
    conversionRate: 19.4,
    activeEcsCount: 2,
    status: 'temporary',
  },
];

export const MOCK_ECS: EcPerformanceRecord[] = [
  {
    ecId: 'EC-014',
    ecCode: 'EC-SPK-014',
    ecName: 'EC Sarah Pratama',
    center: 'Jakarta South',
    assignedLocation: 'Pondok Indah Mall 2 - South Wing',
    totalLeads: 148,
    totalBookings: 46,
    conversionRate: 31.1,
    rank: 1,
    tier: 'Top Tier',
  },
  {
    ecId: 'EC-008',
    ecCode: 'EC-SPK-008',
    ecName: 'EC Rizky Mahendra',
    center: 'Jakarta Central',
    assignedLocation: 'Grand Indonesia - Level 3 Booth A',
    totalLeads: 132,
    totalBookings: 38,
    conversionRate: 28.8,
    rank: 2,
    tier: 'Top Tier',
  },
  {
    ecId: 'EC-021',
    ecCode: 'EC-SPK-021',
    ecName: 'EC Amanda Kusuma',
    center: 'Jakarta Central',
    assignedLocation: 'Central Park Mall - Promenade Atrium',
    totalLeads: 120,
    totalBookings: 32,
    conversionRate: 26.7,
    rank: 3,
    tier: 'Top Tier',
  },
  {
    ecId: 'EC-005',
    ecCode: 'EC-SPK-005',
    ecName: 'EC Budi Santoso',
    center: 'Surabaya West',
    assignedLocation: 'Pakuwon Mall - Grand Atrium Fl 1',
    totalLeads: 110,
    totalBookings: 27,
    conversionRate: 24.5,
    rank: 4,
    tier: 'Core',
  },
  {
    ecId: 'EC-017',
    ecCode: 'EC-SPK-017',
    ecName: 'EC Kevin Tan',
    center: 'Jakarta South',
    assignedLocation: 'Pondok Indah Mall 2 - South Wing',
    totalLeads: 95,
    totalBookings: 22,
    conversionRate: 23.2,
    rank: 5,
    tier: 'Core',
  },
  {
    ecId: 'EC-011',
    ecCode: 'EC-SPK-011',
    ecName: 'EC Nadia Wijaya',
    center: 'Bandung East',
    assignedLocation: 'Paris Van Java - Concourse Level',
    totalLeads: 88,
    totalBookings: 19,
    conversionRate: 21.6,
    rank: 6,
    tier: 'Core',
  },
  {
    ecId: 'EC-029',
    ecCode: 'EC-SPK-029',
    ecName: 'EC Dimas Wicaksono',
    center: 'Medan North',
    assignedLocation: 'Sun Plaza - Ground Floor Hub',
    totalLeads: 72,
    totalBookings: 14,
    conversionRate: 19.4,
    rank: 7,
    tier: 'Developing',
  },
];

export const MOCK_PIPELINE_AUDIT: PipelineAuditRecord[] = [
  {
    stage: 'Source of Truth',
    name: 'Google Sheets (Retail Master Data)',
    status: 'unverified',
    details: 'Primary data sheet identified; awaiting schema & header definition audit.',
    lastChecked: 'Pending Audit Review',
  },
  {
    stage: 'Integration Middleware',
    name: 'Google Apps Script (Web App / API)',
    status: 'unverified',
    details: 'Endpoints not yet inspected. Direct fetch or scraping is intentionally blocked.',
    lastChecked: 'Pending Audit Review',
  },
  {
    stage: 'Security & Access Control',
    name: 'Authorized Internal Dashboard',
    status: 'mock_active',
    details: 'Customer PII strictly omitted. No hardcoded credentials. Using mock fixtures.',
    lastChecked: 'Current Active Mode',
  },
  {
    stage: 'EC Application Boundary',
    name: 'EC-Facing Application',
    status: 'verified',
    details: 'Isolated in separate GitHub repo. No shared mutable endpoints or cross-coupling.',
    lastChecked: 'Verified Isolated',
  },
];
