'use client';

import React, { createContext, useContext, useState } from 'react';

interface ObjectData {
  zone_name: string | null;
  buildings: string | null;
  apartments: string | null;
}

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // New: For hierarchical navigation
  setSelectedLocation: (location: ObjectData) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Handle hierarchical navigation
  const setSelectedLocation = (location: ObjectData) => {
    // For now, we'll just set the search term
    // In the future, we might want to do more complex navigation
    if (location.apartments) {
      setSearchTerm(location.apartments);
    } else if (location.buildings) {
      setSearchTerm(location.buildings);
    } else if (location.zone_name) {
      setSearchTerm(location.zone_name || '');
    }
  };

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm, setSelectedLocation }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}