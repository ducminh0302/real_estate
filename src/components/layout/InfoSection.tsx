'use client';

import TabContainer from './TabContainer';

interface InfoSectionProps {
  className?: string;
  mapDimensions?: { mapWidth: number; searchWidth: number };
}

export default function InfoSection({ className = '', mapDimensions }: InfoSectionProps) {
  return (
    <section 
      className={`flex flex-col h-full overflow-hidden ${className}`}
    >
      <div className="flex-1 overflow-hidden">
        <TabContainer mapDimensions={mapDimensions} />
      </div>
    </section>
  );
}
