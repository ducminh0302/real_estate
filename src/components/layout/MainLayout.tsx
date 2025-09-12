'use client';

import { useEffect, useState } from 'react';
import Header from './Header';
import InfoSection from './InfoSection';
import ChatSection from './ChatSection';
import ChatInput from './ChatInput';
import { SearchProvider } from './SearchContext';
import { LocationSelectionProvider } from './LocationSelectionContext';

export default function MainLayout() {
  const [infoSectionWidth, setInfoSectionWidth] = useState(0);
  const [mapDimensions, setMapDimensions] = useState({ mapWidth: 0, searchWidth: 0 });
  
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window === 'undefined') return;
      
      // Tính toán chiều cao available chính xác - header 64px + margin bottom 66px
      const reservedHeight = 64 + 66;
      const availableHeight = window.innerHeight - reservedHeight;
      
      // Map aspect ratio gốc
      const mapAspectRatio = 10567 / 9495;
      
      // Map width khi zoom 100% = chiều cao InfoSection
      const mapWidth = availableHeight * mapAspectRatio;
      
      // Tổng chiều rộng mong muốn cho InfoSection 
      const desiredTotalWidth = mapWidth + 350; // Giảm search width từ 400 -> 350
      const searchWidth = 350;
      
      setInfoSectionWidth(desiredTotalWidth);
      setMapDimensions({ mapWidth, searchWidth });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <LocationSelectionProvider>
      <SearchProvider>
        <div className="main-grid bg-white">
          {/* Header */}
          <Header />
          
          {/* Main Content - Không có khoảng trống phía dưới */}
          <main className="flex overflow-hidden main-content">
            {/* Phần trên: Chat Section bên trái + Info Section bên phải */}
            <div className="flex flex-1 overflow-hidden">
              {/* Chat Section - Chiếm phần trống bên trái */}
              <div className="flex flex-col flex-1 h-full">
                <ChatSection />
              </div>
              
              {/* Info Section - chiều rộng cố định, sát lề phải (giữ nguyên như cũ) */}
              <div 
                className="h-full flex-shrink-0" 
                style={{ width: `${infoSectionWidth}px` }}
              >
                <InfoSection mapDimensions={mapDimensions} />
              </div>
            </div>
          </main>
          
          {/* Chat Input - Phía dưới cùng, có 2 khoảng trống 136px ở 2 bên */}
          <div className="flex w-full" style={{ height: '66px' }}>
            {/* Khoảng trống bên trái 136px */}
            <div style={{ width: '136px' }}></div>
            
            {/* Chat Input */}
            <div className="flex-1">
              <ChatInput />
            </div>
            
            {/* Khoảng trống bên phải 136px */}
            <div style={{ width: '136px' }}></div>
          </div>
        </div>
      </SearchProvider>
    </LocationSelectionProvider>
  );
}
