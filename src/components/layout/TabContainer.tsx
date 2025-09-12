'use client';

import { useTabStore } from '@/lib/store/tabStore';

// Import tab components
import ProjectInfoTab from '../tabs/ProjectInfoTab';
import ProjectMapTab from '../tabs/ProjectMapTab';
import FloorPlanTab from '../tabs/FloorPlanTab';

const tabComponents = {
  'sheet-info': ProjectInfoTab,
  'project-map': ProjectMapTab,
  'floor-plans': FloorPlanTab,
};

interface TabContainerProps {
  mapDimensions?: { mapWidth: number; searchWidth: number };
}

export default function TabContainer({ mapDimensions }: TabContainerProps) {
  const { activeTab } = useTabStore();

  const ActiveComponent = tabComponents[activeTab];

  if (!ActiveComponent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-neutral-500">Tab không tồn tại</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden h-full">
      {/* Direct Tab Content - No headers, moved to main header */}
      <div className="flex-1 overflow-hidden">
        <ActiveComponent mapDimensions={mapDimensions} />
      </div>
    </div>
  );
}
