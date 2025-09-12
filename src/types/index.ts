// Common types for the Real Estate Chat Interface

export interface Tab {
  id: string;
  title: string;
  isCollapsed: boolean;
  isActive: boolean;
}

export type TabType = 'sheet-info' | 'project-map' | 'floor-plans';

// Map and Location Types
export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface MapAnnotation {
  label: string;
  coordinates: Point[];
}

export interface MapImageInfo {
  width: number;
  height: number;
  path: string;
}

export interface MapData {
  map_image: MapImageInfo;
  annotations: MapAnnotation[];
}

// Real Estate Structure Types
export interface ApartmentLabel {
  original_label: string;
  label_type: 'apartment';
  zone_name: string;
  building_name: string;
  apartment_number: string;
}

export interface BuildingLabel {
  original_label: string;
  label_type: 'building';
  zone_name: string;
  building_name: string;
}

export interface ZoneLabel {
  original_label: string;
  label_type: 'zone';
  zone_name: string;
}

export interface Building {
  building_name: string;
  total_apartments: number;
  building_labels: BuildingLabel[];
  apartment_labels: ApartmentLabel[];
}

export interface Zone {
  zone_name: string;
  total_labels: number;
  zone_labels: ZoneLabel[];
  buildings: Record<string, Building>;
}

export interface RealEstateData {
  zones: Record<string, Zone>;
}

// Search and Processing Types
export interface ProcessedLocation {
  id: string;
  type: 'zone' | 'building' | 'apartment';
  name: string;
  zone_name?: string;
  building_name?: string;
  apartment_number?: string;
  original_label: string;
  bounding_box?: BoundingBox;
  polygon_points?: Point[];
}

export interface SearchFilters {
  zone?: string;
  building?: string;
  apartment?: string;
}

export interface SearchResult {
  location: ProcessedLocation;
  score: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
}
