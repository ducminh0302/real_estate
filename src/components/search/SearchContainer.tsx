'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Building, Home } from 'lucide-react';
import { SearchResult, ProcessedLocation } from '@/types';
import {
  searchLocations,
  getAllZones,
  getBuildingsInZone,
  getApartmentsInBuilding 
} from '@/lib/dataProcessor';

interface SearchContainerProps {
  onLocationSelect?: (location: ProcessedLocation) => void;
  className?: string;
}

type SearchTab = 'zones' | 'buildings' | 'apartments';

export default function SearchContainer({ onLocationSelect, className }: SearchContainerProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>('zones');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [browseData, setBrowseData] = useState<ProcessedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');

  // Load initial browse data
  useEffect(() => {
    loadBrowseData();
  }, [activeTab, selectedZone, selectedBuilding]);

  const loadBrowseData = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: ProcessedLocation[] = [];
      
      switch (activeTab) {
        case 'zones':
          data = await getAllZones();
          break;
        case 'buildings':
          if (selectedZone) {
            data = await getBuildingsInZone(selectedZone);
          }
          break;
        case 'apartments':
          if (selectedZone && selectedBuilding) {
            data = await getApartmentsInBuilding(selectedZone, selectedBuilding);
          }
          break;
      }
      
      setBrowseData(data);
    } catch (error) {
      console.error('Error loading browse data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedZone, selectedBuilding]);

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchLocations(query, activeTab === 'zones' ? 'zone' : 
                                            activeTab === 'buildings' ? 'building' : 'apartment');
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleLocationClick = (location: ProcessedLocation) => {
    onLocationSelect?.(location);

    // Update selection state for cascading tabs
    if (location.type === 'zone') {
      setSelectedZone(location.zone_name || '');
      setSelectedBuilding('');
    } else if (location.type === 'building') {
      setSelectedZone(location.zone_name || '');
      setSelectedBuilding(location.building_name || '');
    }
  };

  const getTabIcon = (tab: SearchTab) => {
    switch (tab) {
      case 'zones': return <MapPin className="w-4 h-4" />;
      case 'buildings': return <Building className="w-4 h-4" />;
      case 'apartments': return <Home className="w-4 h-4" />;
    }
  };

  const getTabLabel = (tab: SearchTab) => {
    switch (tab) {
      case 'zones': return 'Phân Khu';
      case 'buildings': return 'Tòa Nhà';
      case 'apartments': return 'Căn Hộ';
    }
  };

  const tabs: SearchTab[] = ['zones', 'buildings', 'apartments'];

  const displayData = searchQuery.trim() ? searchResults.map(r => r.location) : browseData;

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Tìm Kiếm Bất Động Sản</h3>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Tìm kiếm ${getTabLabel(activeTab).toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors
              ${activeTab === tab 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}
            `}
          >
            {getTabIcon(tab)}
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Breadcrumb for nested navigation */}
      {(selectedZone || selectedBuilding) && !searchQuery.trim() && (
        <div className="px-4 py-2 bg-blue-50 border-b text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            {selectedZone && (
              <>
                <button 
                  onClick={() => {setSelectedZone(''); setSelectedBuilding(''); setActiveTab('zones');}}
                  className="text-blue-600 hover:underline"
                >
                  Tất cả phân khu
                </button>
                <span>›</span>
                <span className="font-medium">{selectedZone}</span>
              </>
            )}
            {selectedBuilding && (
              <>
                <span>›</span>
                <span className="font-medium">{selectedBuilding}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-h-96 overflow-y-auto">
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
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-blue-50"
                >
                  <div className="flex items-center gap-3">
                    {getTabIcon(location.type as SearchTab)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {location.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {location.type === 'apartment' && `${location.zone_name} › ${location.building_name}`}
                        {location.type === 'building' && location.zone_name}
                        {location.type === 'zone' && `${browseData.filter(l => l.zone_name === location.zone_name && l.type === 'building').length} tòa nhà`}
                      </div>
                    </div>
                    {searchResult && (
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full
                          ${searchResult.matchType === 'exact' ? 'bg-green-100 text-green-800' :
                            searchResult.matchType === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'}
                        `}>
                          {searchResult.matchType === 'exact' ? 'Chính xác' :
                           searchResult.matchType === 'partial' ? 'Tương tự' : 'Liên quan'}
                        </span>
                      </div>
                    )}
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
