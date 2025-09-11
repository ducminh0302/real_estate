import { create } from 'zustand';
import { TabType } from '@/types';

interface TabState {
  activeTab: TabType;
  collapsedTabs: Set<TabType>;
  
  // Actions
  setActiveTab: (tab: TabType) => void;
  toggleTabCollapse: (tab: TabType) => void;
  isTabCollapsed: (tab: TabType) => boolean;
}

export const useTabStore = create<TabState>((set, get) => ({
  activeTab: 'sheet-info',
  collapsedTabs: new Set(),

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    
    // Auto-expand the active tab if it's collapsed
    const state = get();
    if (state.collapsedTabs.has(tab)) {
      const newCollapsed = new Set(state.collapsedTabs);
      newCollapsed.delete(tab);
      set({ collapsedTabs: newCollapsed });
    }
  },

  toggleTabCollapse: (tab) => {
    set((state) => {
      const newCollapsed = new Set(state.collapsedTabs);
      if (newCollapsed.has(tab)) {
        newCollapsed.delete(tab);
      } else {
        newCollapsed.add(tab);
      }
      return { collapsedTabs: newCollapsed };
    });
  },

  isTabCollapsed: (tab) => {
    return get().collapsedTabs.has(tab);
  },
}));
