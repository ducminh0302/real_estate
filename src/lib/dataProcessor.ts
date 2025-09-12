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
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: RealEstateData = await response.json();
    realEstateDataCache = data;
    console.log('✅ Real estate data loaded successfully');
    return data;
  } catch (error) {
    console.error('❌ Error loading real estate data:', error);
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

      // Xử lý từng building trong zone
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
        
        // Xử lý từng apartment trong building
        building.apartment_labels.forEach((apartmentLabel, index) => {
          if (index < 3) { // Log first 3 apartments only  
            console.log(`    🏠 Processing apartment: ${apartmentLabel.apartment_number}`);
          }
          
          const apartmentCoordinates = mapAnnotationsLookup.get(apartmentLabel.original_label.toLowerCase());
          if (index < 3) {
            console.log(`      🔍 Apartment "${apartmentLabel.original_label}" -> coordinates: ${apartmentCoordinates ? 'Found' : 'NOT FOUND'}`);
          }
          
          const apartmentLocation: ProcessedLocation = {
            id: `apartment-${zoneKey.replace(/\s+/g, '-')}-${buildingKey.replace(/\s+/g, '-')}-${apartmentLabel.apartment_number}`,
            type: 'apartment',
            name: `Căn ${apartmentLabel.apartment_number}`,
            zone_name: zone.zone_name,
            building_name: building.building_name,
            apartment_number: apartmentLabel.apartment_number,
            original_label: apartmentLabel.original_label,
            polygon_points: apartmentCoordinates,
            bounding_box: apartmentCoordinates ? coordinatesToBoundingBox(apartmentCoordinates) : undefined
          };
          
          processedLocations.push(apartmentLocation);
        });
        
        if (building.apartment_labels.length > 3) {
          console.log(`    ... and ${building.apartment_labels.length - 3} more apartments`);
        }
      });
    });

    console.log(`✅ Processing complete! Generated ${processedLocations.length} locations`);
    console.log(`📊 Breakdown: 
      Zones: ${processedLocations.filter(l => l.type === 'zone').length}
      Buildings: ${processedLocations.filter(l => l.type === 'building').length}
      Apartments: ${processedLocations.filter(l => l.type === 'apartment').length}
    `);

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
    // Skip locations without bounding box (not found on map)
    if (!location.bounding_box) {
      return;
    }

    let score = 0;
    let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy';

    // === ENHANCED SEARCH LOGIC ===
    
    // 1. Exact match trong name
    if (location.name.toLowerCase() === queryLower) {
      score = 100;
      matchType = 'exact';
    }
    // 2. Exact match trong original label
    else if (location.original_label.toLowerCase() === queryLower) {
      score = 95;
      matchType = 'exact';
    }
    // 3. Cross-level search: tìm apartment có zone name trong query
    // Ví dụ: "Glory Heights GH-01 3" -> tìm apartment "GH-01 3" trong zone "Glory Heights"
    else if (location.type === 'apartment' && queryLower.includes(' ')) {
      const queryParts = queryLower.split(' ');
      const zoneName = location.zone_name?.toLowerCase() || '';
      const apartmentName = location.name.toLowerCase();
      
      // Kiểm tra nếu query chứa zone name và apartment name
      const zoneWords = zoneName.split(' ');
      const hasZoneMatch = zoneWords.some(zoneWord => 
        zoneWord.length > 2 && queryLower.includes(zoneWord)
      );
      
      // Kiểm tra apartment name match
      const apartmentWords = apartmentName.split(' ');
      const hasApartmentMatch = apartmentWords.every(apartmentWord =>
        queryLower.includes(apartmentWord.toLowerCase())
      );
      
      if (hasZoneMatch && hasApartmentMatch) {
        score = 90;
        matchType = 'exact';
      }
      // Nếu chỉ có apartment match nhưng query có nhiều từ (có thể có zone name)
      else if (hasApartmentMatch && queryParts.length > 2) {
        score = 85;
        matchType = 'partial';
      }
    }
    // 4. Cross-level search: tìm building có zone name trong query
    // Ví dụ: "Glory Heights GH-01" -> tìm building "GH-01" trong zone "Glory Heights"
    else if (location.type === 'building' && queryLower.includes(' ')) {
      const zoneName = location.zone_name?.toLowerCase() || '';
      const buildingName = location.name.toLowerCase();
      
      const zoneWords = zoneName.split(' ');
      const hasZoneMatch = zoneWords.some(zoneWord => 
        zoneWord.length > 2 && queryLower.includes(zoneWord)
      );
      
      const hasBuildingMatch = queryLower.includes(buildingName);
      
      if (hasZoneMatch && hasBuildingMatch) {
        score = 88;
        matchType = 'exact';
      }
    }
    // 5. Partial match trong name
    else if (location.name.toLowerCase().includes(queryLower)) {
      score = 80;
      matchType = 'partial';
    }
    // 6. Partial match trong original label
    else if (location.original_label.toLowerCase().includes(queryLower)) {
      score = 75;
      matchType = 'partial';
    }
    // 7. Fuzzy match trong zone/building names và apartment number
    else if (
      location.zone_name?.toLowerCase().includes(queryLower) ||
      location.building_name?.toLowerCase().includes(queryLower) ||
      location.apartment_number?.toLowerCase().trim().includes(queryLower)
    ) {
      score = 60;
      matchType = 'fuzzy';
    }

    // Apply type filter after scoring but boost score if matches requested type
    if (score > 0) {
      // If type filter is specified, only include matching types
      if (type && location.type !== type) {
        return;
      }
      
      // Boost score if matches the requested type
      if (type && location.type === type) {
        score += 5;
      }

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
