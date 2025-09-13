'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, Map } from 'lucide-react';
import HierarchicalSearch from '@/components/search/HierarchicalSearch';
import MapViewer from '@/components/map/MapViewer';
import { ProcessedLocation } from '@/types';
import { useSearch } from '@/components/layout/SearchContext';
import { useLocationSelection } from '@/components/layout/LocationSelectionContext';
import { searchLocations } from '@/lib/dataProcessor';

interface ProjectMapTabProps {
  mapDimensions?: { mapWidth: number; searchWidth: number };
}

export default function ProjectMapTab({ mapDimensions }: ProjectMapTabProps) {
  const [selectedLocation, setSelectedLocation] = useState<ProcessedLocation | undefined>();
  const [selectedApartmentForHighlight, setSelectedApartmentForHighlight] = useState<ProcessedLocation | undefined>(undefined); // Changed to undefined
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(true);
  const mapRef = useRef<{ autoZoomOnSearchClose: () => void } | null>(null);
  const { searchTerm: globalSearchTerm } = useSearch();
  const { selectedLocation: selectedFromChat } = useLocationSelection(); // Add location selection from chat

  const handleLocationSelect = (location: ProcessedLocation) => {
    setSelectedLocation(location);
    // Reset apartment highlight when selecting a new location directly
    if (location.type !== 'apartment') {
      setSelectedApartmentForHighlight(undefined);
    }
  };

  const handleApartmentSelect = (apartment: ProcessedLocation | undefined) => {
    setSelectedApartmentForHighlight(apartment);
  };

  const handleSearchToggle = (open: boolean) => {
    setIsSearchPanelOpen(open);
    
    // Auto zoom to 200% and reset position when closing search - with smooth transition
    if (!open && mapRef.current) {
      // Thêm một độ trễ nhỏ để đảm bảo UI đã cập nhật trước khi zoom
      setTimeout(() => {
        mapRef.current?.autoZoomOnSearchClose();
      }, 50);
    }
  };

  // Search panel width từ props hoặc fallback
  const searchWidth = mapDimensions?.searchWidth || 350;

  // Listen for location selection from chat
  useEffect(() => {
    const handleChatLocationSelection = async () => {
      if (selectedFromChat) {
        try {
          let searchTerm = '';
          
          // Determine what to search for based on the chat selection
          if (selectedFromChat.apartments) {
            const apartmentString = selectedFromChat.apartments;
            console.log('🏠 Chat selected apartment:', apartmentString);
            
            // Parse apartment string like "GH-02 5" into building and apartment number
            const match = apartmentString.match(/^(.+?)\s+(\d+)$/);
            if (match) {
              const buildingName = match[1]; // "GH-02"  
              const apartmentNumber = match[2]; // "5"
              
              console.log('🔍 Parsed - Building:', buildingName, 'Apartment:', apartmentNumber);
              
              // Search for apartments in this specific building with this number
              const searchResults = await searchLocations('', 'apartment', 100);
              
              console.log('📍 Found apartments:', searchResults.length);
              
              // Filter results to find exact match
              const exactMatch = searchResults.find(result => 
                result.location.building_name === buildingName && 
                result.location.apartment_number === apartmentNumber
              );
              
              console.log('🎯 Exact match found:', exactMatch ? exactMatch.location.name : 'NOT FOUND');
              
              if (exactMatch) {
                setSelectedApartmentForHighlight(exactMatch.location);
                return;
              }
            }
            
            // Fallback to original apartment string search
            searchTerm = apartmentString;
          } else if (selectedFromChat.buildings) {
            searchTerm = selectedFromChat.buildings;  
          } else if (selectedFromChat.zone_name) {
            searchTerm = selectedFromChat.zone_name;
          }

          if (searchTerm) {
            // Search for the location using dataProcessor
            const searchResults = await searchLocations(searchTerm, undefined, 5);
            
            if (searchResults.length > 0) {
              const bestMatch = searchResults[0].location;
              
              // Update the map based on the type of location found
              if (bestMatch.type === 'apartment') {
                setSelectedApartmentForHighlight(bestMatch);
              } else {
                setSelectedLocation(bestMatch);
                setSelectedApartmentForHighlight(undefined);
              }
            }
          }
        } catch (error) {
          console.error('Error handling chat location selection:', error);
        }
      }
    };

    handleChatLocationSelection();
  }, [selectedFromChat]);

  return (
    <div className="flex h-full">
      {/* Search Panel - Only when open */}
      {isSearchPanelOpen && (
        <div 
          className="border-r border-neutral-200 bg-white flex flex-col"
          style={{ width: searchWidth }}
        >
          {/* Search Panel Header with Toggle */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Tìm Kiếm Bất Động Sản</h3>
              <button
                onClick={() => handleSearchToggle(false)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <SearchIcon size={14} />
                Ẩn tìm kiếm
              </button>
            </div>
          </div>
          
          {/* Search Content */}
          <div className="flex-1 min-h-0">
            <HierarchicalSearch 
              onLocationSelect={handleLocationSelect}
              onApartmentSelect={handleApartmentSelect} // New prop
              className="h-full border-none shadow-none"
              globalSearchTerm={globalSearchTerm}
            />
          </div>
        </div>
      )}

      {/* Map Viewer - Takes remaining space */}
      <div className="flex-1 relative bg-gray-100">
        {/* Search Toggle Button - Only when search is hidden */}
        {!isSearchPanelOpen && (
          <button
            onClick={() => handleSearchToggle(true)}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white text-gray-600 hover:bg-gray-50 border rounded-lg text-sm font-medium transition-colors shadow-lg"
          >
            <SearchIcon size={14} />
            Tìm kiếm
          </button>
        )}

        <MapViewer
          ref={mapRef}
          selectedLocation={selectedLocation}
          selectedApartmentForHighlight={selectedApartmentForHighlight} // New prop
          onLocationClick={handleLocationSelect}
          className="h-full"
          mapDimensions={mapDimensions}
        />
      </div>
    </div>
  );
}
