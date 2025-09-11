'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronRight, Home, Building, MapPin, ArrowLeft } from 'lucide-react';
import { SearchResult, ProcessedLocation } from '@/types';
import {
  searchLocations,
  getAllZones,
  getBuildingsInZone,
  getApartmentsInBuilding 
} from '@/lib/dataProcessor';

interface HierarchicalSearchProps {
  onLocationSelect?: (location: ProcessedLocation) => void;
  className?: string;
}

type SelectionLevel = 'zones' | 'buildings' | 'apartments';

export default function HierarchicalSearch({ onLocationSelect, className }: HierarchicalSearchProps) {
  const [currentLevel, setCurrentLevel] = useState<SelectionLevel>('zones');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [browseData, setBrowseData] = useState<ProcessedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Selection state
  const [selectedZone, setSelectedZone] = useState<ProcessedLocation | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<ProcessedLocation | null>(null);

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
      
      const results = await searchLocations(query, levelType);
      
      // Filter results based on current selections
      let filteredResults = results;
      if (currentLevel === 'buildings' && selectedZone) {
        filteredResults = results.filter(r => r.location.zone_name === selectedZone.zone_name);
      } else if (currentLevel === 'apartments' && selectedZone && selectedBuilding) {
        filteredResults = results.filter(r => 
          r.location.zone_name === selectedZone.zone_name && 
          r.location.building_name === selectedBuilding.building_name
        );
      }
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLevel, selectedZone, selectedBuilding]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleLocationClick = (location: ProcessedLocation) => {
    // Always trigger location select for auto zoom
    onLocationSelect?.(location);
    
    if (currentLevel === 'zones') {
      setSelectedZone(location);
      setSelectedBuilding(null);
      setCurrentLevel('buildings');
      setSearchQuery('');
    } else if (currentLevel === 'buildings') {
      setSelectedBuilding(location);
      setCurrentLevel('apartments');
      setSearchQuery('');
    }
    // For apartments, just select without navigating further
  };

  const handleBackNavigation = () => {
    if (currentLevel === 'buildings') {
      setCurrentLevel('zones');
      setSelectedZone(null);
      setSelectedBuilding(null);
    } else if (currentLevel === 'apartments') {
      setCurrentLevel('buildings');
      setSelectedBuilding(null);
    }
    setSearchQuery('');
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
  const displayData = searchQuery.trim() ? searchResults.map(r => r.location) : browseData;

  return (
    <div className={`bg-white flex flex-col h-full ${className}`}>
      {/* Navigation Header */}
      <div className="p-4 border-b bg-white flex-shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <button
            onClick={() => {
              setCurrentLevel('zones');
              setSelectedZone(null);
              setSelectedBuilding(null);
              setSearchQuery('');
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
                  setSearchQuery('');
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
                  setSearchQuery('');
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
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-3 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        )}
        
        {/* Level Header */}
        <div className="flex items-center gap-2 mb-3">
          {levelInfo.icon}
          <h4 className="text-base font-medium text-gray-800">{levelInfo.title}</h4>
        </div>
        
        <p className="text-sm text-gray-500 mb-3">{levelInfo.description}</p>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={levelInfo.placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 300px)' }}>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : displayData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery.trim() ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayData.map((location) => {
              const isSearchResult = searchQuery.trim();
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
                        {currentLevel === 'zones' && (
                          <div className="text-sm text-gray-500">
                            {/* Count buildings in zone */}
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
