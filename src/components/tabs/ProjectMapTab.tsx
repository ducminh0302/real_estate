'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, Map } from 'lucide-react';
import HierarchicalSearch from '@/components/search/HierarchicalSearch';
import MapViewer from '@/components/map/MapViewer';
import { ProcessedLocation } from '@/types';

export default function ProjectMapTab() {
  const [selectedLocation, setSelectedLocation] = useState<ProcessedLocation | undefined>();
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(true);
  const mapRef = useRef<any>(null);

  // Loại bỏ useEffect tính toán chiều cao, sử dụng chiều cao từ parent

  const handleLocationSelect = (location: ProcessedLocation) => {
    setSelectedLocation(location);
  };

  const handleSearchToggle = (open: boolean) => {
    setIsSearchPanelOpen(open);
    
    // Auto zoom to 200% and reset position when closing search - IMMEDIATELY
    if (!open && mapRef.current) {
      // Thực hiện ngay lập tức không có delay
      mapRef.current.autoZoomOnSearchClose();
    }
  };

  // Search panel width cố định
  const searchWidth = 400;

  return (
    <div className="flex h-full">
      {/* Search Panel - Only when open */}
      {isSearchPanelOpen && (
        <div 
          className="border-r border-neutral-200 bg-white flex flex-col"
          style={{ width: searchWidth }}
        >
          {/* Search Panel Header with Toggle */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
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
              className="h-full border-none shadow-none"
            />
          </div>
        </div>
      )}

      {/* Map Viewer - Takes remaining space */}
      <div 
        className="flex-1 relative bg-gray-100"
      >
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
          onLocationClick={handleLocationSelect}
          className="h-full"
        />
      </div>
    </div>
  );
}
