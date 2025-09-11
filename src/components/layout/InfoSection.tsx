'use client';

import { useEffect, useState } from 'react';
import TabContainer from './TabContainer';

interface InfoSectionProps {
  className?: string;
}

export default function InfoSection({ className = '' }: InfoSectionProps) {
  const [mapWidth, setMapWidth] = useState(0);
  const [totalInfoWidth, setTotalInfoWidth] = useState(0);
  
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window === 'undefined') return;
      
      // Tính toán chiều cao available chính xác - header 64px + chat input 80px = 144px
      const reservedHeight = 144;
      const availableHeight = window.innerHeight - reservedHeight;
      
      const searchWidth = 400;
      const mapAspectRatio = 10567 / 9495;
      const calculatedMapWidth = availableHeight * mapAspectRatio;
      const calculatedTotalInfoWidth = calculatedMapWidth + searchWidth;
      
      setMapWidth(calculatedMapWidth);
      setTotalInfoWidth(calculatedTotalInfoWidth);
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <section 
      className={`flex flex-col h-full overflow-hidden ${className}`}
    >
      <div className="flex-1 overflow-hidden">
        <TabContainer />
      </div>
    </section>
  );
}
