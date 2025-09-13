'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronRight, Home, Building, MapPin, ArrowLeft } from 'lucide-react';
import { SearchResult, ProcessedLocation } from '@/types';
import {
  searchLocations,
  getAllZones,
  getBuildingsInZone,
  getApartmentsInBuilding 
} from '@/lib/dataProcessor';
import { useLocationSelection } from '@/components/layout/LocationSelectionContext';

interface HierarchicalSearchProps {
  onLocationSelect?: (location: ProcessedLocation) => void;
  onApartmentSelect?: (apartment: ProcessedLocation | undefined) => void; // Allow undefined to clear highlight
  className?: string;
  globalSearchTerm?: string;
}

type SelectionLevel = 'zones' | 'buildings' | 'apartments';

export default function HierarchicalSearch({ 
  onLocationSelect, 
  onApartmentSelect, // New prop
  className, 
  globalSearchTerm
}: HierarchicalSearchProps) {
  const [currentLevel, setCurrentLevel] = useState<SelectionLevel>('zones');
  const [userSearchQuery, setUserSearchQuery] = useState(''); // Giá trị do người dùng nhập
  const [displaySearchQuery, setDisplaySearchQuery] = useState(''); // Giá trị hiển thị trong ô tìm kiếm
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [browseData, setBrowseData] = useState<ProcessedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Selection state
  const [selectedZone, setSelectedZone] = useState<ProcessedLocation | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<ProcessedLocation | null>(null);
  
  const { selectedLocation, setSelectedLocation } = useLocationSelection();

  // Refs to store the latest values for use in callbacks
  const selectedZoneRef = useRef(selectedZone);
  const selectedBuildingRef = useRef(selectedBuilding);
  const currentLevelRef = useRef(currentLevel);

  // Update refs when state changes
  useEffect(() => {
    selectedZoneRef.current = selectedZone;
    selectedBuildingRef.current = selectedBuilding;
    currentLevelRef.current = currentLevel;
  }, [selectedZone, selectedBuilding, currentLevel]);

  // Khi globalSearchTerm thay đổi, cập nhật userSearchQuery và displaySearchQuery
  useEffect(() => {
    if (globalSearchTerm !== undefined) {
      setUserSearchQuery(globalSearchTerm);
      setDisplaySearchQuery(globalSearchTerm);
    }
  }, [globalSearchTerm]);

  // Khi selectedLocation thay đổi từ bên ngoài, thực hiện điều hướng phân cấp
  useEffect(() => {
    if (selectedLocation) {
      handleExternalLocationSelect(selectedLocation);
      // Reset selectedLocation sau khi xử lý xong
      setTimeout(() => {
        setSelectedLocation(null);
      }, 0);
    }
  }, [selectedLocation]);

  const handleExternalLocationSelect = async (location: { zone_name: string | null; buildings: string | null; apartments: string | null }) => {
    // Reset selections
    setSelectedZone(null);
    setSelectedBuilding(null);
    // Reset search query khi điều hướng từ bên ngoài
    setUserSearchQuery('');
    setDisplaySearchQuery('');
    
    // Nếu có căn hộ, điều hướng đến căn hộ
    if (location.apartments) {
      await navigateToApartment(location.zone_name, location.buildings, location.apartments);
    } 
    // Nếu có tòa nhà, điều hướng đến tòa nhà
    else if (location.buildings) {
      await navigateToBuilding(location.zone_name, location.buildings);
    } 
    // Nếu có phân khu, điều hướng đến phân khu
    else if (location.zone_name) {
      await navigateToZone(location.zone_name);
    }
    // Đảm bảo isLoading được tắt
    setIsLoading(false);
  };

  const navigateToZone = async (zoneName: string | null) => {
    if (!zoneName) return Promise.resolve(null);
    
    setIsLoading(true);
    try {
      const zones = await getAllZones();
      const zone = zones.find(z => z.zone_name === zoneName);
      
      if (zone) {
        setSelectedZone(zone);
        setCurrentLevel('buildings');
        // Trigger map zoom
        onLocationSelect?.(zone);
        return zone;
      }
      return null;
    } catch (error) {
      console.error('Error navigating to zone:', error);
      return null;
    } finally {
      // setIsLoading(false); sẽ được gọi ở cấp cao hơn
    }
  };

  const navigateToBuilding = async (zoneName: string | null, buildingName: string | null) => {
    if (!zoneName || !buildingName) return Promise.resolve(null);
    
    setIsLoading(true);
    try {
      // First navigate to zone
      const zone = await navigateToZone(zoneName);
      
      if (zone) {
        const buildings = await getBuildingsInZone(zoneName);
        const building = buildings.find(b => b.building_name === buildingName);
        
        if (building) {
          setSelectedBuilding(building);
          setCurrentLevel('apartments');
          // Trigger map zoom
          onLocationSelect?.(building);
          return building;
        }
      }
      return null;
    } catch (error) {
      console.error('Error navigating to building:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToApartment = async (zoneName: string | null, buildingName: string | null, apartmentName: string | null) => {
    if (!zoneName || !buildingName || !apartmentName) {
      console.log('navigateToApartment: Missing required parameters', { zoneName, buildingName, apartmentName });
      return Promise.resolve(null);
    }
    
    console.log('navigateToApartment: Starting navigation', { zoneName, buildingName, apartmentName });
    
    setIsLoading(true);
    try {
      // Create temp zone
      const tempZone: ProcessedLocation = {
        id: `zone-${zoneName.replace(/\s+/g, '-')}`,
        type: 'zone',
        name: zoneName,
        zone_name: zoneName,
        original_label: zoneName,
      };
      setSelectedZone(tempZone);
      
      // Create temp building
      const tempBuilding: ProcessedLocation = {
        id: `building-${buildingName.replace(/\s+/g, '-')}`,
        type: 'building',
        name: buildingName,
        zone_name: zoneName,
        building_name: buildingName,
        original_label: buildingName,
      };
      setSelectedBuilding(tempBuilding);
      
      // Set current level to apartments
      setCurrentLevel('apartments');
      
      // Wait a bit for state to update and loadBrowseData to run
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the apartment data for map zoom
      const apartments = await getApartmentsInBuilding(zoneName, buildingName);
      console.log('navigateToApartment: Full raw apartments list:', JSON.parse(JSON.stringify(apartments))); // Deep clone to avoid proxy objects in console
      console.log('navigateToApartment: Looking for apartmentName:', `"${apartmentName}"`);
      
      // --- START TEMPORARY FIX FOR APARTMENT NAME MISMATCH ---
      // Extract the apartment number from the full name (e.g., "OS1 2" -> "2")
      // This is a workaround until the data model is updated to include a direct mapping.
      const extractApartmentNumber = (fullName: string): string => {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/); // Split by one or more spaces
        // Heuristic: Take the last numeric part or the last part if all parts are numeric
        // This handles cases like "OS1 02" -> "02" or "OS1 2" -> "2" or "2" -> "2"
        for (let i = parts.length - 1; i >= 0; i--) {
          if (/^\d+$/.test(parts[i])) {
            return parts[i];
          }
        }
        // If no purely numeric part found, check if the last part is mostly numeric (e.g., "A123")
        const lastPart = parts[parts.length - 1];
        if (lastPart) {
             // Check if it ends with numbers, e.g., "A101" -> "101"
             const match = lastPart.match(/(\d+)$/);
             if (match) {
                 return match[1];
             }
         }
        // Fallback: return the last part
        return lastPart || fullName;
      };

      const normalizedTargetName = apartmentName?.toLowerCase().trim();
      const extractedTargetNumber = extractApartmentNumber(apartmentName || '').toLowerCase();
      console.log('navigateToApartment: Extracted target number:', `"${extractedTargetNumber}"`);

      // --- END TEMPORARY FIX ---
      
      // Detailed logging for comparison
      let foundApartment = null;
      for (let i = 0; i < apartments.length; i++) {
        const a = apartments[i];
        const normalizedApartmentNumber = a.apartment_number?.toLowerCase().trim();
        
        console.log(`navigateToApartment: Comparing index ${i}:`);
        console.log(`  - a.apartment_number: "${a.apartment_number}"`);
        console.log(`  - normalized a.apartment_number: "${normalizedApartmentNumber}"`);
        console.log(`  - Original apartmentName: "${apartmentName}"`);
        console.log(`  - Normalized target name: "${normalizedTargetName}"`);
        console.log(`  - Extracted target number: "${extractedTargetNumber}"`);
        
        // Check for direct match first (old way)
        const isDirectMatch = normalizedApartmentNumber === normalizedTargetName;
        console.log(`  - Direct match (old): ${isDirectMatch}`);
        
        // Check for extracted number match (new way)
        const isExtractedMatch = normalizedApartmentNumber === extractedTargetNumber;
        console.log(`  - Extracted number match (new): ${isExtractedMatch}`);
        
        if (isDirectMatch || isExtractedMatch) {
          console.log(`navigateToApartment: Found matching apartment at index ${i}`, a);
          foundApartment = a;
          // Break on first match
          break; 
        }
      }
      
      const apartment = foundApartment;
      console.log('navigateToApartment: Final apartment found:', apartment);
      
      if (apartment) {
        // Trigger map zoom with the building that contains the apartment
        console.log('navigateToApartment: Triggering onLocationSelect with building', tempBuilding);
        onLocationSelect?.(tempBuilding);
        // Also send the specific apartment for highlighting
        console.log('navigateToApartment: Triggering onApartmentSelect with apartment', apartment);
        onApartmentSelect?.(apartment);
      } else {
        // If we can't find the apartment, at least select the building
        console.log('navigateToApartment: Apartment not found, triggering onLocationSelect with building', tempBuilding);
        onLocationSelect?.(tempBuilding);
        onApartmentSelect?.(undefined); // Clear apartment highlight
      }
      
      setIsLoading(false);
      return apartment || tempBuilding;
    } catch (error) {
      console.error('Error navigating to apartment:', error);
      setIsLoading(false);
      // Even if there's an error, try to select the building
      if (zoneName && buildingName) {
        const tempBuilding: ProcessedLocation = {
          id: `building-${buildingName.replace(/\s+/g, '-')}`,
          type: 'building',
          name: buildingName,
          zone_name: zoneName,
          building_name: buildingName,
          original_label: buildingName,
        };
        onLocationSelect?.(tempBuilding);
        return tempBuilding;
      }
      return null;
    }
  };

  // Load browse data based on current level and selections
  useEffect(() => {
    loadBrowseData();
  }, [currentLevel, selectedZone, selectedBuilding]);

  const loadBrowseData = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: ProcessedLocation[] = [];
      
      switch (currentLevel) {
        case 'zones':
          data = await getAllZones();
          break;
        case 'buildings':
          if (selectedZone?.zone_name) {
            data = await getBuildingsInZone(selectedZone.zone_name);
          }
          break;
        case 'apartments':
          if (selectedZone?.zone_name && selectedBuilding?.building_name) {
            data = await getApartmentsInBuilding(selectedZone.zone_name, selectedBuilding.building_name);
          }
          break;
      }
      
      setBrowseData(data);
    } catch (error) {
      console.error('Error loading browse data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLevel, selectedZone, selectedBuilding]);

  // Perform search within current level
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      let levelType: 'zone' | 'building' | 'apartment';
      switch (currentLevel) {
        case 'zones': levelType = 'zone'; break;
        case 'buildings': levelType = 'building'; break;
        case 'apartments': levelType = 'apartment'; break;
      }
      
      // Enhanced search: tìm kiếm cross-level nếu query có nhiều từ
      const queryWords = query.trim().split(' ');
      let results: SearchResult[] = [];
      
      // Nếu query có nhiều từ, thử search cross-level
      if (queryWords.length > 1) {
        // Tìm tất cả types để có thể match cross-level
        const allResults = await searchLocations(query);
        
        // Ưu tiên kết quả theo level hiện tại, nhưng vẫn hiển thị cross-level matches
        const currentLevelResults = allResults.filter(r => r.location.type === levelType);
        const crossLevelResults = allResults.filter(r => r.location.type !== levelType);
        
        // Kết hợp kết quả, ưu tiên current level
        results = [...currentLevelResults, ...crossLevelResults];
      } else {
        // Search thông thường trong level hiện tại
        results = await searchLocations(query, levelType);
      }
      
      // Filter results based on current selections (chỉ áp dụng cho same-level search)
      let filteredResults = results;
      if (currentLevel === 'buildings' && selectedZone) {
        // Chỉ filter building results, cho phép cross-level results khác
        filteredResults = results.filter(r => 
          r.location.type !== 'building' || r.location.zone_name === selectedZone.zone_name
        );
      } else if (currentLevel === 'apartments' && selectedZone && selectedBuilding) {
        // Chỉ filter apartment results trong same building, cho phép cross-level results khác
        filteredResults = results.filter(r => 
          r.location.type !== 'apartment' || 
          (r.location.zone_name === selectedZone.zone_name && 
           r.location.building_name === selectedBuilding.building_name)
        );
      }
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLevel, selectedZone, selectedBuilding]);

  // Debounced search dựa trên userSearchQuery
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(userSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, performSearch]);

  const handleLocationClick = (location: ProcessedLocation) => {
    // Always trigger location select for auto zoom
    onLocationSelect?.(location);
    
    // Handle cross-level navigation
    if (location.type === 'zone') {
      setSelectedZone(location);
      setSelectedBuilding(null);
      setCurrentLevel('buildings');
    } else if (location.type === 'building') {
      // If clicking building from cross-level search, navigate to zone first if needed
      if (currentLevel === 'zones' || !selectedZone || selectedZone.zone_name !== location.zone_name) {
        // Find and set the zone first
        const zoneName = location.zone_name;
        if (zoneName) {
          // Create a temporary zone location for navigation
          const tempZone: ProcessedLocation = {
            id: `zone-${zoneName.replace(/\s+/g, '-')}`,
            type: 'zone',
            name: zoneName,
            zone_name: zoneName,
            original_label: zoneName,
          };
          setSelectedZone(tempZone);
        }
      }
      setSelectedBuilding(location);
      setCurrentLevel('apartments');
    } else if (location.type === 'apartment') {
      // If clicking apartment from cross-level search, navigate through zone and building
      if (location.zone_name && location.building_name) {
        // Set zone if not already set or different
        if (!selectedZone || selectedZone.zone_name !== location.zone_name) {
          const tempZone: ProcessedLocation = {
            id: `zone-${location.zone_name.replace(/\s+/g, '-')}`,
            type: 'zone',
            name: location.zone_name,
            zone_name: location.zone_name,
            original_label: location.zone_name,
          };
          setSelectedZone(tempZone);
        }
        
        // Set building if not already set or different
        if (!selectedBuilding || selectedBuilding.building_name !== location.building_name) {
          const tempBuilding: ProcessedLocation = {
            id: `building-${location.building_name.replace(/\s+/g, '-')}`,
            type: 'building',
            name: location.building_name,
            zone_name: location.zone_name,
            building_name: location.building_name,
            original_label: location.building_name,
          };
          setSelectedBuilding(tempBuilding);
          // Zoom to the building that contains this apartment
          onLocationSelect?.(tempBuilding);
        }
        // Highlight the specific apartment
        onApartmentSelect?.(location);
        
        setCurrentLevel('apartments');
      }
      // Original logic for same-level navigation is replaced by the above
      // onLocationSelect?.(location); // Removed to avoid conflicting zoom
    }
    
    // Original logic for same-level navigation
    if (currentLevel === 'zones' && location.type === 'zone') {
      setSelectedZone(location);
      setSelectedBuilding(null);
      setCurrentLevel('buildings');
    } else if (currentLevel === 'buildings' && location.type === 'building') {
      setSelectedBuilding(location);
      setCurrentLevel('apartments');
    }
    // For apartments, just select without navigating further
  };

  const handleBackNavigation = () => {
    if (currentLevel === 'buildings') {
      setCurrentLevel('zones');
      setSelectedZone(null);
      setSelectedBuilding(null);
      // Reset search query khi quay lại
      setUserSearchQuery('');
      setDisplaySearchQuery('');
    } else if (currentLevel === 'apartments') {
      setCurrentLevel('buildings');
      setSelectedBuilding(null);
      // Reset search query khi quay lại
      setUserSearchQuery('');
      setDisplaySearchQuery('');
    }
  };

  const getLevelInfo = () => {
    switch (currentLevel) {
      case 'zones':
        return {
          icon: <MapPin className="w-4 h-4" />,
          title: 'Chọn Phân Khu',
          placeholder: 'Tìm kiếm phân khu...',
          description: 'Chọn phân khu để xem các tòa nhà'
        };
      case 'buildings':
        return {
          icon: <Building className="w-4 h-4" />,
          title: 'Chọn Tòa Nhà',
          placeholder: 'Tìm kiếm tòa nhà...',
          description: 'Chọn tòa nhà để xem các căn hộ'
        };
      case 'apartments':
        return {
          icon: <Home className="w-4 h-4" />,
          title: 'Chọn Căn Hộ',
          placeholder: 'Tìm kiếm căn hộ...',
          description: 'Chọn căn hộ để xem chi tiết'
        };
    }
  };

  const levelInfo = getLevelInfo();
  const displayData = displaySearchQuery.trim() ? searchResults.map(r => r.location) : browseData;

  // Hàm xử lý khi người dùng thay đổi ô tìm kiếm
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserSearchQuery(value);
    setDisplaySearchQuery(value);
  };

  return (
    <div className={`bg-white flex flex-col h-full ${className}`}>
      {/* Navigation Header */}
      <div className="p-3 border-b bg-white flex-shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-2 text-sm">
          <button
            onClick={() => {
              setCurrentLevel('zones');
              setSelectedZone(null);
              setSelectedBuilding(null);
              // Reset search query
              setUserSearchQuery('');
              setDisplaySearchQuery('');
            }}
            className={`${currentLevel === 'zones' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Phân khu
          </button>
          
          {selectedZone && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <button
                onClick={() => {
                  setCurrentLevel('buildings');
                  setSelectedBuilding(null);
                  // Reset search query
                  setUserSearchQuery('');
                  setDisplaySearchQuery('');
                }}
                className={`${currentLevel === 'buildings' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {selectedZone.name}
              </button>
            </>
          )}
          
          {selectedBuilding && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <button
                onClick={() => {
                  setCurrentLevel('apartments');
                  // Reset search query
                  setUserSearchQuery('');
                  setDisplaySearchQuery('');
                }}
                className={`${currentLevel === 'apartments' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {selectedBuilding.name}
              </button>
            </>
          )}
        </div>

        {/* Back Button */}
        {currentLevel !== 'zones' && (
          <button
            onClick={handleBackNavigation}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 mb-2 text-sm"
          >
            <ArrowLeft className="w-3 h-3" />
            Quay lại
          </button>
        )}
        
        {/* Level Header */}
        <div className="flex items-center gap-2 mb-2">
          {levelInfo.icon}
          <h4 className="text-base font-semibold text-gray-800">{levelInfo.title}</h4>
        </div>
        
        <p className="text-sm text-gray-500 mb-3">{levelInfo.description}</p>
        
        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={levelInfo.placeholder}
            value={displaySearchQuery}
            onChange={handleSearchInputChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        
        {/* Search Suggestions */}
        <div className="flex flex-wrap gap-1 mb-1">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-[10px] rounded-full cursor-pointer hover:bg-blue-200 transition-colors">
            #trường học
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-[10px] rounded-full cursor-pointer hover:bg-green-200 transition-colors">
            #y tế
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-[10px] rounded-full cursor-pointer hover:bg-purple-200 transition-colors">
            #công viên
          </span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-[10px] rounded-full cursor-pointer hover:bg-orange-200 transition-colors">
            #siêu thị
          </span>
          <span className="px-2 py-1 bg-red-100 text-red-800 text-[10px] rounded-full cursor-pointer hover:bg-red-200 transition-colors">
            #trung tâm thương mại
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 250px)' }}>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : displayData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {displaySearchQuery.trim() ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayData.map((location) => {
              const isSearchResult = displaySearchQuery.trim();
              const searchResult = isSearchResult ? 
                searchResults.find(r => r.location.id === location.id) : null;
              
              return (
                <button
                  key={location.id}
                  onClick={() => handleLocationClick(location)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-blue-50 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {levelInfo.icon}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {location.name}
                        </div>
                        
                        {/* Enhanced search result display */}
                        {isSearchResult ? (
                          <div className="text-sm text-gray-500">
                            {location.type === 'zone' && 'Phân khu'}
                            {location.type === 'building' && `Tòa nhà trong ${location.zone_name}`}
                            {location.type === 'apartment' && `Căn hộ - ${location.building_name}, ${location.zone_name}`}
                          </div>
                        ) : (
                          <>
                            {currentLevel === 'zones' && (
                              <div className="text-sm text-gray-500">
                                Chọn để xem tòa nhà
                              </div>
                            )}
                            {currentLevel === 'buildings' && (
                              <div className="text-sm text-gray-500">
                                Trong {location.zone_name}
                              </div>
                            )}
                            {currentLevel === 'apartments' && (
                              <div className="text-sm text-gray-500">
                                {location.building_name} - {location.zone_name}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {searchResult && (
                        <span className={`px-2 py-1 text-xs rounded-full
                          ${searchResult.matchType === 'exact' ? 'bg-green-100 text-green-800' :
                            searchResult.matchType === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'}
                        `}>
                          {searchResult.matchType === 'exact' ? 'Chính xác' :
                           searchResult.matchType === 'partial' ? 'Tương tự' : 'Liên quan'}
                        </span>
                      )}
                      
                      {currentLevel !== 'apartments' && (
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
