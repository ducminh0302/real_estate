import { 
  RealEstateData, 
  MapData, 
  ProcessedLocation, 
  SearchResult, 
  Point,
  BoundingBox 
} from '@/types';
import { coordinatesToBoundingBox } from './mapUtils';

// Cache cho dữ liệu đã xử lý
let processedDataCache: ProcessedLocation[] | null = null;
let realEstateDataCache: RealEstateData | null = null;
let mapDataCache: MapData | null = null;

/**
 * Load và cache dữ liệu real estate
 */
export async function loadRealEstateData(): Promise<RealEstateData> {
  if (realEstateDataCache) {
    return realEstateDataCache;
  }

  try {
    const response = await fetch('/data/final_labels.json');
    const data: RealEstateData = await response.json();
    realEstateDataCache = data;
    return data;
  } catch (error) {
    console.error('Error loading real estate data:', error);
    throw new Error('Failed to load real estate data');
  }
}

/**
 * Load và cache dữ liệu map
 */
export async function loadMapData(): Promise<MapData> {
  if (mapDataCache) {
    return mapDataCache;
  }

  try {
    const response = await fetch('/data/map_normalized.json');
    const data: MapData = await response.json();
    mapDataCache = data;
    return data;
  } catch (error) {
    console.error('Error loading map data:', error);
    throw new Error('Failed to load map data');
  }
}

/**
 * Xử lý và kết hợp dữ liệu từ real estate và map data
 */
export async function processAndCombineData(): Promise<ProcessedLocation[]> {
  if (processedDataCache) {
    return processedDataCache;
  }

  console.log('🔄 Processing and combining data...');
  
  try {
    const [realEstateData, mapData] = await Promise.all([
      loadRealEstateData(),
      loadMapData()
    ]);

    console.log('📊 Real Estate Data loaded:', Object.keys(realEstateData.zones));
    console.log('🗺️ Map Data loaded:', mapData.annotations.length, 'annotations');

    const processedLocations: ProcessedLocation[] = [];

    // Tạo lookup map cho map annotations
    const mapAnnotationsLookup = new Map<string, Point[]>();
    mapData.annotations.forEach(annotation => {
      mapAnnotationsLookup.set(annotation.label.toLowerCase(), annotation.coordinates);
    });

    console.log('🔍 Available map labels (first 10):', 
      Array.from(mapAnnotationsLookup.keys()).slice(0, 10));

    // Xử lý từng zone
    Object.entries(realEstateData.zones).forEach(([zoneKey, zone]) => {
      console.log(`\n🏘️ Processing zone: ${zone.zone_name}`);
      
      // Xử lý zone labels
      zone.zone_labels.forEach(zoneLabel => {
        const coordinates = mapAnnotationsLookup.get(zoneLabel.original_label.toLowerCase());
        console.log(`  🔍 Zone label "${zoneLabel.original_label}" -> coordinates: ${coordinates ? 'Found' : 'NOT FOUND'}`);
        
        const location: ProcessedLocation = {
          id: `zone-${zoneKey.replace(/\s+/g, '-')}`,
          type: 'zone',
          name: zone.zone_name,
          zone_name: zone.zone_name,
          original_label: zoneLabel.original_label,
          polygon_points: coordinates,
          bounding_box: coordinates ? coordinatesToBoundingBox(coordinates) : undefined
        };
        processedLocations.push(location);
      });

      // Xử lý buildings trong zone
      Object.entries(zone.buildings).forEach(([buildingKey, building]) => {
        console.log(`  🏢 Processing building: ${building.building_name}`);
        
        // Xử lý building labels
        building.building_labels.forEach(buildingLabel => {
          const coordinates = mapAnnotationsLookup.get(buildingLabel.original_label.toLowerCase());
          console.log(`    🔍 Building label "${buildingLabel.original_label}" -> coordinates: ${coordinates ? 'Found' : 'NOT FOUND'}`);
          
          const location: ProcessedLocation = {
            id: `building-${zoneKey.replace(/\s+/g, '-')}-${buildingKey}`,
            type: 'building',
            name: building.building_name,
            zone_name: zone.zone_name,
            building_name: building.building_name,
            original_label: buildingLabel.original_label,
            polygon_points: coordinates,
            bounding_box: coordinates ? coordinatesToBoundingBox(coordinates) : undefined
          };
          processedLocations.push(location);
        });

        // Xử lý apartments trong building  
        building.apartment_labels.forEach((apartmentLabel, index) => {
          if (index < 3) { // Log first 3 apartments only
            const coordinates = mapAnnotationsLookup.get(apartmentLabel.original_label.toLowerCase());
            console.log(`    🏠 Apartment "${apartmentLabel.original_label}" -> coordinates: ${coordinates ? 'Found' : 'NOT FOUND'}`);
          }
          
          const coordinates = mapAnnotationsLookup.get(apartmentLabel.original_label.toLowerCase());
          const location: ProcessedLocation = {
            id: `apartment-${zoneKey.replace(/\s+/g, '-')}-${buildingKey}-${apartmentLabel.apartment_number}`,
            type: 'apartment',
            name: `Căn ${apartmentLabel.apartment_number}`,
            zone_name: zone.zone_name,
            building_name: building.building_name,
            apartment_number: apartmentLabel.apartment_number,
            original_label: apartmentLabel.original_label,
            polygon_points: coordinates,
            bounding_box: coordinates ? coordinatesToBoundingBox(coordinates) : undefined
          };
          processedLocations.push(location);
        });
        
        if (building.apartment_labels.length > 3) {
          console.log(`    ... and ${building.apartment_labels.length - 3} more apartments`);
        }
      });
    });

    console.log(`\n✅ Processed ${processedLocations.length} total locations`);
    console.log(`📍 Locations with coordinates: ${processedLocations.filter(l => l.bounding_box).length}`);
    console.log(`❌ Locations without coordinates: ${processedLocations.filter(l => !l.bounding_box).length}`);
    
    processedDataCache = processedLocations;
    return processedLocations;
    
  } catch (error) {
    console.error('❌ Error processing data:', error);
    throw error;
  }
}

/**
 * Tìm kiếm locations với multiple strategies
 */
export async function searchLocations(
  query: string,
  type?: 'zone' | 'building' | 'apartment',
  limit: number = 20
): Promise<SearchResult[]> {
  const locations = await processAndCombineData();
  const queryLower = query.toLowerCase().trim();
  
  if (!queryLower) {
    return [];
  }

  const results: SearchResult[] = [];

  locations.forEach(location => {
    // Filter by type if specified
    if (type && location.type !== type) {
      return;
    }

    // Skip locations without bounding box (not found on map)
    if (!location.bounding_box) {
      return;
    }

    let score = 0;
    let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy';

    // Exact match trong name
    if (location.name.toLowerCase() === queryLower) {
      score = 100;
      matchType = 'exact';
    }
    // Exact match trong original label
    else if (location.original_label.toLowerCase() === queryLower) {
      score = 95;
      matchType = 'exact';
    }
    // Partial match trong name
    else if (location.name.toLowerCase().includes(queryLower)) {
      score = 80;
      matchType = 'partial';
    }
    // Partial match trong original label
    else if (location.original_label.toLowerCase().includes(queryLower)) {
      score = 75;
      matchType = 'partial';
    }
    // Fuzzy match trong zone/building names
    else if (
      location.zone_name?.toLowerCase().includes(queryLower) ||
      location.building_name?.toLowerCase().includes(queryLower) ||
      location.apartment_number?.includes(query)
    ) {
      score = 60;
      matchType = 'fuzzy';
    }

    if (score > 0) {
      results.push({
        location,
        score,
        matchType
      });
    }
  });

  // Sort by score (highest first) and return limited results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Lấy tất cả zones
 */
export async function getAllZones(): Promise<ProcessedLocation[]> {
  const locations = await processAndCombineData();
  return locations.filter(loc => loc.type === 'zone' && loc.bounding_box);
}

/**
 * Lấy tất cả buildings trong một zone
 */
export async function getBuildingsInZone(zoneName: string): Promise<ProcessedLocation[]> {
  const locations = await processAndCombineData();
  return locations.filter(loc => 
    loc.type === 'building' && 
    loc.zone_name === zoneName &&
    loc.bounding_box
  );
}

/**
 * Lấy tất cả apartments trong một building
 */
export async function getApartmentsInBuilding(
  zoneName: string, 
  buildingName: string
): Promise<ProcessedLocation[]> {
  const locations = await processAndCombineData();
  return locations.filter(loc => 
    loc.type === 'apartment' && 
    loc.zone_name === zoneName &&
    loc.building_name === buildingName &&
    loc.bounding_box
  );
}

/**
 * Clear cache (useful for development/testing)
 */
export function clearDataCache(): void {
  processedDataCache = null;
  realEstateDataCache = null;
  mapDataCache = null;
}
