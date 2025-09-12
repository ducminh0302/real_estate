'use client';

import React, { createContext, useContext, useState } from 'react';

interface ObjectData {
  zone_name: string | null;
  buildings: string | null;
  apartments: string | null;
}

interface LocationSelectionContextType {
  selectedLocation: ObjectData | null;
  setSelectedLocation: (location: ObjectData | null) => void;
}

const LocationSelectionContext = createContext<LocationSelectionContextType | undefined>(undefined);

export function LocationSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<ObjectData | null>(null);

  return (
    <LocationSelectionContext.Provider value={{ selectedLocation, setSelectedLocation }}>
      {children}
    </LocationSelectionContext.Provider>
  );
}

export function useLocationSelection() {
  const context = useContext(LocationSelectionContext);
  if (context === undefined) {
    throw new Error('useLocationSelection must be used within a LocationSelectionProvider');
  }
  return context;
}