'use client';

import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Building } from 'lucide-react';
import { useFloorPlanStore } from '@/lib/store/floorPlanStore';
import { FloorPlanApartment } from '@/types';

interface FloorPlanTabProps {
  mapDimensions?: { mapWidth: number; searchWidth: number };
}

export default function FloorPlanTab({ mapDimensions }: FloorPlanTabProps) {
  const [zoom, setZoom] = useState<number>(1); // Mặc định 100%
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState<boolean>(false);
  const [apartmentData, setApartmentData] = useState<FloorPlanApartment[]>([]); // Dữ liệu bounding box của căn hộ
  const [highlightAnimation, setHighlightAnimation] = useState<number>(0); // Giá trị animation cho highlight
  
  // Sử dụng store để sync với chat
  const { selectedFloor, selectedApartment, setSelectedFloor, setSelectedApartment } = useFloorPlanStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Data cho các tầng
  const floorOptions = [
    { value: 'tang-2', label: 'Tầng 2', image: '/S6.06_Tang 2.jpg' },
    { value: 'tang-3-29', label: 'Tầng 3-29', image: '/S6.06_Tang 3-29.jpg' }
  ];

  // Danh sách căn hộ
  const getApartmentOptions = (floor: string) => {
    // Tạm thời hardcode danh sách căn hộ, sau này sẽ load từ JSON
    if (floor === 'tang-2' || floor === 'tang-3-29') {
      return Array.from({ length: 30 }, (_, i) => {
        const num = i + 1;
        return { value: `CH${num.toString().padStart(2, '0')}`, label: `CH${num.toString().padStart(2, '0')}` };
      });
    }
    return [];
  };

  const apartmentOptions = getApartmentOptions(selectedFloor);

  // Hàm tạo mapping giữa tên căn hộ và label trong JSON
  const getApartmentLabelMapping = () => {
    const mapping: Record<string, string> = {};
    for (let i = 1; i <= 30; i++) {
      const chNumber = `CH${i.toString().padStart(2, '0')}`;
      const s606Number = `S6.06 ${i}`;
      mapping[chNumber] = s606Number;
    }
    return mapping;
  };

  const apartmentLabelMapping = getApartmentLabelMapping();

  // Tìm bounding box của căn hộ được chọn
  const matchedApartments = apartmentData.filter(
    (apt: FloorPlanApartment) => {
      const mappedLabel = apartmentLabelMapping[selectedApartment];
      if (!selectedApartment || !mappedLabel) return false;
      
      const match = apt.label === mappedLabel;
      return match;
    }
  );
  
  const selectedApartmentData = matchedApartments.length > 0 ? matchedApartments[0] : null;

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
    
    // Đặt ảnh căn chỉnh đúng với khung nhìn
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const imageWidth = imageRef.current.clientWidth;
    const imageHeight = imageRef.current.clientHeight;
    
    // Căn chỉnh theo chiều ngang - đảm bảo mép trái của ảnh không vào trong khung nhìn
    const x = imageWidth > containerWidth ? 0 : (containerWidth - imageWidth) / 2;
    
    // Căn chỉnh theo chiều dọc
    const y = imageHeight > containerHeight ? 0 : (containerHeight - imageHeight) / 2;
    
    setPosition({ 
      x: x,
      y: y
    });
  };

  // Effect để auto reset khi component mount và đã ở client hoặc khi đổi tầng
  useEffect(() => {
    if (!isClient) return;
    const timeoutId = setTimeout(resetToTopLeft, 100);
    return () => clearTimeout(timeoutId);
  }, [isClient, selectedFloor]);

  // Effect để điều chỉnh vị trí khi zoom thay đổi
  useEffect(() => {
    if (!containerRef.current || !imageRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const imageWidth = imageRef.current.clientWidth * zoom;
    
    // Điều chỉnh vị trí x khi zoom thay đổi để đảm bảo mép trái/phải không vào trong khung nhìn
    if (imageWidth > containerWidth) {
      // Nếu ảnh lớn hơn khung nhìn
      const maxRight = containerWidth - imageWidth;
      if (position.x < maxRight) {
        // Nếu vị trí hiện tại vượt quá giới hạn phải, điều chỉnh về giới hạn
        setPosition(prev => ({ ...prev, x: maxRight }));
      } else if (position.x > 0) {
        // Nếu vị trí hiện tại vượt quá giới hạn trái, điều chỉnh về giới hạn
        setPosition(prev => ({ ...prev, x: 0 }));
      }
    } else {
      // Nếu ảnh nhỏ hơn khung nhìn, căn giữa
      const centeredX = (containerWidth - imageWidth) / 2;
      setPosition(prev => ({ ...prev, x: centeredX }));
    }
  }, [zoom]);

  // Effect để load dữ liệu bounding box khi tầng được chọn thay đổi
  useEffect(() => {
    const loadApartmentData = async () => {
      try {
        let data = [];
        if (selectedFloor === 'tang-2') {
          const response = await fetch('/data/S6.06_Tang_2_simplified.json');
          if (!response.ok) {
            throw new Error(`Failed to load data for tang-2: ${response.status} ${response.statusText}`);
          }
          data = await response.json();
        } else if (selectedFloor === 'tang-3-29') {
          const response = await fetch('/data/S6.06_Tang_3-29_simplified.json');
          if (!response.ok) {
            throw new Error(`Failed to load data for tang-3-29: ${response.status} ${response.statusText}`);
          }
          data = await response.json();
        }

        setApartmentData(data);
      } catch (error) {
        console.error('Error loading apartment data:', error);
      }
    };

    loadApartmentData();
  }, [selectedFloor]);

  // Effect để vẽ bounding box lên canvas khi selectedApartmentData thay đổi
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Chỉ vẽ highlight nếu có căn hộ được chọn
        if (selectedApartmentData && selectedApartmentData.points) {
          // Draw polygon
          ctx.beginPath();
          selectedApartmentData.points.forEach((point: number[], index: number) => {
            if (index === 0) {
              ctx.moveTo(point[0], point[1]);
            } else {
              ctx.lineTo(point[0], point[1]);
            }
          });
          ctx.closePath();
          
          // Stroke with red and animated line width
          ctx.strokeStyle = '#ff0000'; // Màu đỏ
          ctx.lineWidth = highlightAnimation > 0 ? highlightAnimation : 6; // Mặc định là 6 nếu không có animation
          ctx.setLineDash([]); // Không có dash
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }
    }
  }, [selectedApartmentData, highlightAnimation]);

  // Effect để tạo animation cho highlight
  useEffect(() => {
    // Chỉ chạy animation nếu có căn hộ được chọn
    if (!selectedApartmentData) {
      setHighlightAnimation(0);
      return;
    }
    
    let animationFrameId: number;
    let startTime: number | null = null;
    const duration = 2000; // 2 seconds for one cycle
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      
      // Tạo hiệu ứng dao động giữa 4.5 và 7.5
      const animationValue = 6 + Math.sin(progress * 2 * Math.PI) * 1.5;
      setHighlightAnimation(animationValue);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedApartmentData]);

  // Effect để center khi chọn căn hộ (không zoom)
  useEffect(() => {
    // Không làm gì cả - chỉ giữ lại effect để tránh lỗi nếu có component nào phụ thuộc
    // Khi chọn căn hộ, không di chuyển ảnh, không zoom ảnh
  }, [selectedApartment]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 1)); // Giới hạn zoom nhỏ nhất là 1 (100%)
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Tính toán giới hạn di chuyển
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const imageWidth = imageRef.current.clientWidth * zoom;
    const imageHeight = imageRef.current.clientHeight * zoom;
    
    // Giới hạn di chuyển theo chiều ngang - không cho phép mép trái/phải của ảnh vào trong khung nhìn
    let newX = position.x + deltaX;
    if (imageWidth > containerWidth) {
      // Nếu ảnh lớn hơn khung nhìn, giới hạn kéo ảnh
      const maxLeft = 0; // Không cho mép trái của ảnh vào trong khung nhìn
      const maxRight = containerWidth - imageWidth; // Không cho mép phải của ảnh vào trong khung nhìn
      newX = Math.max(maxRight, Math.min(newX, maxLeft));
    } else {
      // Nếu ảnh nhỏ hơn khung nhìn, căn giữa ảnh
      newX = (containerWidth - imageWidth) / 2;
    }
    
    // Giới hạn di chuyển theo chiều dọc - chỉ giới hạn mép trên, mép dưới tự do
    let newY = position.y + deltaY;
    if (imageHeight > containerHeight) {
      // Nếu ảnh lớn hơn khung nhìn, chỉ giới hạn mép trên
      const maxTop = 0; // Không cho mép trên của ảnh vào trong khung nhìn
      if (newY > maxTop) {
        newY = maxTop; // Giữ mép trên không vào trong khung nhìn
      }
      // Mép dưới tự do, không giới hạn
    } else {
      // Nếu ảnh nhỏ hơn khung nhìn, căn giữa theo chiều dọc
      newY = (containerHeight - imageHeight) / 2;
    }
    
    setPosition({ x: newX, y: newY });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 1), 5); // Giới hạn zoom từ 100% đến 500%
    
    // Chỉ setZoom, effect sẽ tự động điều chỉnh vị trí
    setZoom(newZoom);
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
                <select 
                  className="text-sm bg-white border border-neutral-300 rounded px-2 py-1 cursor-pointer hover:border-primary-300"
                  value={selectedApartment}
                  onChange={(e) => {
                    const newApartment = e.target.value;
                    setSelectedApartment(newApartment);
                  }}
                >
                  <option value="">-- Chọn căn hộ --</option>
                  {apartmentOptions.map(apartment => (
                    <option key={apartment.value} value={apartment.value}>
                      {apartment.label}
                    </option>
                  ))}
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
              transformOrigin: '0 0'
            }}
          >
            <img
              ref={imageRef}
              src={currentImage}
              alt={currentFloor?.label || "Mặt cắt tòa S6.06"}
              className="select-none"
              draggable={false}
              onLoad={() => {
                resetToTopLeft();
                // Update canvas size when image is loaded
                if (imageRef.current && canvasRef.current) {
                  const img = imageRef.current;
                  const canvas = canvasRef.current;
                  
                  // Set canvas dimensions to match image
                  canvas.width = img.naturalWidth || img.width;
                  canvas.height = img.naturalHeight || img.height;
                  
                  // Redraw if we have apartment data
                  if (selectedApartmentData && selectedApartmentData.points) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      // Clear canvas
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      
                      // Draw polygon
                      ctx.beginPath();
                      selectedApartmentData.points.forEach((point: number[], index: number) => {
                        if (index === 0) {
                          ctx.moveTo(point[0], point[1]);
                        } else {
                          ctx.lineTo(point[0], point[1]);
                        }
                      });
                      ctx.closePath();
                      
                      // Stroke with red and animated line width
                      ctx.strokeStyle = '#ff0000'; // Màu đỏ
                      ctx.lineWidth = highlightAnimation > 0 ? highlightAnimation : 6; // Mặc định là 6 nếu không có animation
                      ctx.setLineDash([]); // Không có dash
                      ctx.lineCap = 'round';
                      ctx.lineJoin = 'round';
                      ctx.stroke();
                    }
                  }
                }
              }}
              onError={() => {
                console.error('Error loading image:', currentImage);
              }}
            />
            {/* Canvas Overlay for highlighting apartments */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ 
                zIndex: 10,
                width: '100%',
                height: '100%'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}