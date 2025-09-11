'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ProcessedLocation, Point } from '@/types';

interface ArrowPointerProps {
  location: ProcessedLocation;
  center: Point;
  containerBounds: DOMRect;
  viewState: {
    scale: number;
    translateX: number;
    translateY: number;
  };
  onClick?: (location: ProcessedLocation) => void;
}

export default function ArrowPointer({ 
  location, 
  center, 
  containerBounds, 
  viewState,
  onClick 
}: ArrowPointerProps) {
  // Calculate where the location center would be in viewport coordinates
  const locationScreenX = (center.x * viewState.scale) + viewState.translateX;
  const locationScreenY = (center.y * viewState.scale) + viewState.translateY;
  
  // Check if location is outside viewport
  const isOutsideLeft = locationScreenX < 0;
  const isOutsideRight = locationScreenX > containerBounds.width;
  const isOutsideTop = locationScreenY < 0;
  const isOutsideBottom = locationScreenY > containerBounds.height;
  
  const isOutside = isOutsideLeft || isOutsideRight || isOutsideTop || isOutsideBottom;
  
  if (!isOutside) return null;

  // Calculate pointer position and rotation
  let pointerX = Math.max(20, Math.min(containerBounds.width - 20, locationScreenX));
  let pointerY = Math.max(20, Math.min(containerBounds.height - 20, locationScreenY));
  
  // Clamp to edges with padding
  if (isOutsideLeft) pointerX = 20;
  if (isOutsideRight) pointerX = containerBounds.width - 20;
  if (isOutsideTop) pointerY = 20;
  if (isOutsideBottom) pointerY = containerBounds.height - 20;

  // Calculate angle to point towards the location
  const deltaX = locationScreenX - pointerX;
  const deltaY = locationScreenY - pointerY;
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  // Calculate distance for opacity (farther = more transparent)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const maxDistance = Math.sqrt(containerBounds.width * containerBounds.width + containerBounds.height * containerBounds.height);
  const opacity = Math.max(0.4, 1 - (distance / maxDistance));

  const getPointerColor = (type: string) => {
    switch (type) {
      case 'zone': return 'bg-blue-500 border-blue-600';
      case 'building': return 'bg-orange-500 border-orange-600';
      case 'apartment': return 'bg-green-500 border-green-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getPointerSize = (type: string) => {
    switch (type) {
      case 'zone': return 'w-8 h-8';
      case 'building': return 'w-7 h-7';
      case 'apartment': return 'w-6 h-6';
      default: return 'w-6 h-6';
    }
  };

  return (
    <div
      className={`absolute z-50 ${getPointerSize(location.type)} ${getPointerColor(location.type)} 
                  rounded-full border-2 flex items-center justify-center cursor-pointer
                  shadow-lg hover:scale-110 transition-all duration-200 animate-pulse`}
      style={{
        left: pointerX - 16, // Half of w-8
        top: pointerY - 16,
        opacity,
        transform: `rotate(${angle}deg)`
      }}
      onClick={() => onClick?.(location)}
      title={`${location.name} (${location.type})`}
    >
      <ArrowRight className="w-4 h-4 text-white" style={{ transform: 'rotate(-90deg)' }} />
      
      {/* Tooltip */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        {location.name}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
      </div>
    </div>
  );
}
