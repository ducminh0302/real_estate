'use client';

import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Building } from 'lucide-react';

export default function FloorPlanTab() {
  const [zoom, setZoom] = useState<number>(1); // Mặc định 100%
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState<boolean>(false);
  const [selectedFloor, setSelectedFloor] = useState<string>('tang-2'); // Tầng được chọn
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Data cho các tầng
  const floorOptions = [
    { value: 'tang-2', label: 'Tầng 2', image: '/S6.06_Tang 2.jpg' },
    { value: 'tang-3-29', label: 'Tầng 3-29', image: '/S6.06_Tang 3-29.jpg' }
  ];

  // Lấy ảnh hiện tại dựa trên tầng được chọn
  const currentFloor = floorOptions.find(floor => floor.value === selectedFloor);
  const currentImage = currentFloor?.image || '/S6.06_Tang 2.jpg';

  // Đảm bảo chỉ chạy trên client để tránh hydration error
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset về vị trí top-left với zoom 100%
  const resetToTopLeft = () => {
    if (!containerRef.current || !imageRef.current || !isClient) return;
    
    // Set zoom về 100%
    setZoom(1);
    
    // Đặt ảnh sát mép trái và mép trên của khung nhìn
    setPosition({ 
      x: 0, // Sát lề trái của khung nhìn
      y: 0  // Sát lề trên của khung nhìn
    });
  };

  // Effect để auto reset khi component mount và đã ở client hoặc khi đổi tầng
  useEffect(() => {
    if (!isClient) return;
    const timeoutId = setTimeout(resetToTopLeft, 100);
    return () => clearTimeout(timeoutId);
  }, [isClient, selectedFloor]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.1), 5));
  };

  // Không render gì cho đến khi component được hydrate trên client
  if (!isClient) {
    return (
      <div className="flex flex-col h-full bg-neutral-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-neutral-500">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary-50 rounded-lg">
            <Building size={20} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 mb-2">Mặt cắt tòa nhà</h3>
            <div className="flex gap-4">
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Phân khu</label>
                <select className="text-sm bg-neutral-100 border border-neutral-300 rounded px-2 py-1 cursor-not-allowed" disabled>
                  <option>Vincity Ocean Park</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Tòa nhà</label>
                <select className="text-sm bg-neutral-100 border border-neutral-300 rounded px-2 py-1 cursor-not-allowed" disabled>
                  <option>S6.06</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Tầng</label>
                <select 
                  className="text-sm bg-white border border-neutral-300 rounded px-2 py-1 cursor-pointer hover:border-primary-300"
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                >
                  {floorOptions.map(floor => (
                    <option key={floor.value} value={floor.value}>
                      {floor.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 block mb-1">Căn hộ</label>
                <select className="text-sm bg-neutral-100 border border-neutral-300 rounded px-2 py-1 cursor-not-allowed" disabled>
                  <option>-- Chọn căn hộ --</option>
                </select>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500">Zoom</div>
            <div className="text-lg font-mono font-semibold text-neutral-900">
              {Math.round(zoom * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-24 right-4 z-10 flex flex-col gap-1 bg-white rounded-lg shadow-md p-1">
        <button 
          onClick={handleZoomOut}
          className="p-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button 
          onClick={handleZoomIn}
          className="p-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button 
          onClick={resetToTopLeft}
          className="p-2 text-neutral-600 hover:text-neutral-800 hover:bg-white rounded transition-colors"
          title="Reset về top-left 100%"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Image Viewer */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={containerRef}
          className="w-full h-full relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            className="absolute transition-transform duration-200"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: 'top left'
            }}
          >
            <img
              ref={imageRef}
              src={currentImage}
              alt={currentFloor?.label || "Mặt cắt tòa S6.06"}
              className="select-none"
              draggable={false}
              onLoad={resetToTopLeft}
              onError={() => {
                console.error('Error loading image:', currentImage);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
