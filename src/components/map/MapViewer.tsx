'use client';

import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Navigation } from 'lucide-react';
import { ProcessedLocation, BoundingBox, Point } from '@/types';
import { 
  mapBoundingBoxToImage, 
  expandBoundingBox, 
  getBoundingBoxCenter 
} from '@/lib/mapUtils';
import ArrowPointer from './ArrowPointer';

interface MapViewerProps {
  selectedLocation?: ProcessedLocation;
  highlightedLocations?: ProcessedLocation[];
  onLocationClick?: (location: ProcessedLocation) => void;
  onZoomChange?: (zoom: number) => void;
  className?: string;
}

interface ViewState {
  scale: number;
  translateX: number;
  translateY: number;
}

const MAP_DIMENSIONS = { width: 10567, height: 9495 }; // From map_normalized.json

interface MapViewerRef {
  autoZoomOnSearchClose: () => void;
}

const MapViewer = forwardRef<MapViewerRef, MapViewerProps>(({ 
  selectedLocation, 
  highlightedLocations = [], 
  onLocationClick,
  onZoomChange,
  className 
}, ref) => {
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    translateX: 0,
    translateY: 0
  });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredLocation, setHoveredLocation] = useState<ProcessedLocation | null>(null);
  const [containerBounds, setContainerBounds] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [zoomInput, setZoomInput] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    autoZoomOnSearchClose: () => {
      if (!imageSize.width || !imageSize.height || !containerBounds) return;
      
      // Tính toán scale tối ưu cho zoom 2x
      const imgNaturalRatio = MAP_DIMENSIONS.width / MAP_DIMENSIONS.height;
      const containerRatio = containerBounds.width / containerBounds.height;
      
      let baseScale;
      if (imgNaturalRatio > containerRatio) {
        baseScale = containerBounds.width / imageSize.width;
      } else {
        baseScale = containerBounds.height / imageSize.height;
      }
      
      // Áp dụng zoom 2x trên base scale tối ưu
      const newViewState = constrainViewState({ 
        scale: baseScale * 2.0, 
        translateX: 0, 
        translateY: 0 
      });
      setViewState(newViewState);
    }
  }));

  // Update image size and container bounds when component mounts or resizes
  useEffect(() => {
    const updateSizes = () => {
      if (imageRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        setContainerBounds(containerRect);
        
        const imgNaturalRatio = MAP_DIMENSIONS.width / MAP_DIMENSIONS.height;
        const containerRatio = containerRect.width / containerRect.height;
        
        // Tính toán để zoom 100% sẽ fit tối đa với container
        let displayWidth, displayHeight;
        if (imgNaturalRatio > containerRatio) {
          // Image rộng hơn container - fit width để tối ưu hóa không gian
          displayWidth = containerRect.width;
          displayHeight = displayWidth / imgNaturalRatio;
        } else {
          // Image cao hơn container - fit height để tối ưu hóa không gian  
          displayHeight = containerRect.height;
          displayWidth = displayHeight * imgNaturalRatio;
        }
        
        setImageSize({ width: displayWidth, height: displayHeight });
      }
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;
      
      switch (e.key) {
        case '+':
        case '=':
          handleZoom(0.2);
          e.preventDefault();
          break;
        case '-':
          handleZoom(-0.2);
          e.preventDefault();
          break;
        case '0':
          handleReset();
          e.preventDefault();
          break;
        case 'ArrowUp':
          setViewState(prev => ({ ...prev, translateY: prev.translateY + 50 }));
          e.preventDefault();
          break;
        case 'ArrowDown':
          setViewState(prev => ({ ...prev, translateY: prev.translateY - 50 }));
          e.preventDefault();
          break;
        case 'ArrowLeft':
          setViewState(prev => ({ ...prev, translateX: prev.translateX + 50 }));
          e.preventDefault();
          break;
        case 'ArrowRight':
          setViewState(prev => ({ ...prev, translateX: prev.translateX - 50 }));
          e.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate polygon centroid (trọng tâm)
  const getPolygonCentroid = useCallback((points: Point[]): Point => {
    let x = 0, y = 0;
    for (const point of points) {
      x += point.x;
      y += point.y;
    }
    return {
      x: x / points.length,
      y: y / points.length
    };
  }, []);

  // Zoom to specific location with smooth animation
  const zoomToLocation = useCallback((location: ProcessedLocation) => {
    if ((!location.polygon_points && !location.bounding_box) || !imageSize.width || !imageSize.height) return;

    // Căn hộ: không zoom, chỉ highlight
    if (location.type === 'apartment') {
      return; // Không thực hiện zoom cho căn hộ
    }

    setIsAnimating(true);

    let center: Point;
    let bboxWidth: number;
    let bboxHeight: number;

    if (location.polygon_points && location.polygon_points.length > 0) {
      // Convert polygon coordinates to image coordinates
      const scaleX = imageSize.width / MAP_DIMENSIONS.width;
      const scaleY = imageSize.height / MAP_DIMENSIONS.height;
      
      const imagePolygonPoints = location.polygon_points.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY
      }));

      // Calculate centroid of polygon (trọng tâm)
      center = getPolygonCentroid(imagePolygonPoints);

      // Calculate bounding box for scale calculation
      const xs = imagePolygonPoints.map(p => p.x);
      const ys = imagePolygonPoints.map(p => p.y);
      bboxWidth = Math.max(...xs) - Math.min(...xs);
      bboxHeight = Math.max(...ys) - Math.min(...ys);
    } else {
      // Fallback to bounding box method
      const imageBbox = mapBoundingBoxToImage(
        location.bounding_box!,
        MAP_DIMENSIONS,
        imageSize
      );

      center = getBoundingBoxCenter(imageBbox);
      bboxWidth = imageBbox.x_max - imageBbox.x_min;
      bboxHeight = imageBbox.y_max - imageBbox.y_min;
    }

    // Determine expansion based on location type
    let expansionPercent = 0;
    if (location.type === 'zone') expansionPercent = 0;         // 0% expansion - fit exact bounding box
    else if (location.type === 'building') expansionPercent = 300;  // 300% expansion - giữ nguyên
    else if (location.type === 'apartment') expansionPercent = 300; // 300% expansion (không dùng vì đã return early)

    // Apply expansion to bounding box dimensions
    const expandedWidth = bboxWidth * (1 + expansionPercent / 100);
    const expandedHeight = bboxHeight * (1 + expansionPercent / 100);

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const scaleX = containerRect.width / expandedWidth;
    const scaleY = containerRect.height / expandedHeight;
    const scale = Math.min(scaleX, scaleY, 15); // Max zoom 15x (1500%) - đồng nhất cho tất cả

    // Calculate translation to center the polygon centroid
    let offsetPercent = 0.05; // Default offset cho building
    if (location.type === 'zone') offsetPercent = 0;       // 0% offset - center hoàn toàn cho phân khu 
    else if (location.type === 'building') offsetPercent = 0.05;  // 5% offset cho tòa nhà
    
    const offsetX = containerRect.width * offsetPercent;
    const offsetY = containerRect.height * offsetPercent;
    
    const translateX = (containerRect.width / 2) - (center.x * scale) + offsetX;
    const translateY = (containerRect.height / 2) - (center.y * scale) + offsetY;

    setViewState({ scale, translateX, translateY });
    
    // End animation after transition
    setTimeout(() => setIsAnimating(false), 500);
  }, [imageSize, getPolygonCentroid]);

  // Auto-zoom when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      zoomToLocation(selectedLocation);
    }
  }, [selectedLocation, zoomToLocation]);

  const constrainViewState = (newViewState: ViewState): ViewState => {
    if (!containerBounds || !imageSize.width) return newViewState;
    
    const scaledImageWidth = imageSize.width * newViewState.scale;
    const scaledImageHeight = imageSize.height * newViewState.scale;
    
    let constrainedX = newViewState.translateX;
    let constrainedY = newViewState.translateY;
    
    // Constrain X axis - đảm bảo map không bị lộ khoảng trống
    if (scaledImageWidth <= containerBounds.width) {
      // Nếu ảnh nhỏ hơn container, căn trái thay vì center
      constrainedX = 0;
    } else {
      // Nếu ảnh lớn hơn container, đảm bảo không lộ khoảng trống
      // Cạnh trái không được vượt quá 0
      constrainedX = Math.min(0, constrainedX);
      // Cạnh phải không được vượt quá container width
      constrainedX = Math.max(containerBounds.width - scaledImageWidth, constrainedX);
    }
    
    // Constrain Y axis - tương tự với trục Y
    if (scaledImageHeight <= containerBounds.height) {
      // Nếu ảnh nhỏ hơn container, căn trên thay vì center
      constrainedY = 0;
    } else {
      // Nếu ảnh lớn hơn container, đảm bảo không lộ khoảng trống
      // Cạnh trên không được vượt quá 0
      constrainedY = Math.min(0, constrainedY);
      // Cạnh dưới không được vượt quá container height
      constrainedY = Math.max(containerBounds.height - scaledImageHeight, constrainedY);
    }
    
    return {
      ...newViewState,
      translateX: constrainedX,
      translateY: constrainedY
    };
  };

  const handleZoom = (delta: number, centerPoint?: Point) => {
    setViewState(prev => {
      const newScale = Math.max(1.0, Math.min(15, prev.scale + delta));
      
      let newViewState = { ...prev, scale: newScale };
      
      // If centerPoint provided, zoom towards that point
      if (centerPoint && containerBounds) {
        const scaleDiff = newScale - prev.scale;
        newViewState.translateX = prev.translateX - (centerPoint.x * scaleDiff);
        newViewState.translateY = prev.translateY - (centerPoint.y * scaleDiff);
      }
      
      // Apply boundary constraints
      return constrainViewState(newViewState);
    });
  };

  const handleReset = () => {
    if (!imageSize.width || !imageSize.height || !containerBounds) return;
    
    setIsAnimating(true);
    
    // Tính toán scale để fit tối đa với container (tối ưu hóa không gian)
    const imgNaturalRatio = MAP_DIMENSIONS.width / MAP_DIMENSIONS.height;
    const containerRatio = containerBounds.width / containerBounds.height;
    
    let optimalScale;
    if (imgNaturalRatio > containerRatio) {
      // Image rộng hơn container - fit width
      optimalScale = containerBounds.width / imageSize.width;
    } else {
      // Image cao hơn container - fit height
      optimalScale = containerBounds.height / imageSize.height;
    }
    
    const resetViewState = constrainViewState({ 
      scale: optimalScale, 
      translateX: 0, 
      translateY: 0 
    });
    setViewState(resetViewState);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleFitToView = () => {
    if (!imageSize.width || !imageSize.height || !containerBounds) return;
    
    setIsAnimating(true);
    
    // Tính toán scale để fit tối ưu với container
    const imgNaturalRatio = MAP_DIMENSIONS.width / MAP_DIMENSIONS.height;
    const containerRatio = containerBounds.width / containerBounds.height;
    
    let scale;
    if (imgNaturalRatio > containerRatio) {
      // Image rộng hơn container - fit width để tối đa hóa hiển thị
      scale = containerBounds.width / imageSize.width;
    } else {
      // Image cao hơn container - fit height để tối đa hóa hiển thị
      scale = containerBounds.height / imageSize.height;
    }
    
    // Căn trái và căn trên để tối ưu hóa không gian
    const translateX = 0; // Căn trái
    const translateY = 0; // Căn trên
    
    const fitViewState = constrainViewState({ scale, translateX, translateY });
    setViewState(fitViewState);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewState.translateX, y: e.clientY - viewState.translateY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerBounds || !imageSize.width) return;
    
    const newTranslateX = e.clientX - dragStart.x;
    const newTranslateY = e.clientY - dragStart.y;
    
    // Sử dụng constrainViewState để đảm bảo consistency
    const constrainedViewState = constrainViewState({
      ...viewState,
      translateX: newTranslateX,
      translateY: newTranslateY
    });
    
    setViewState(constrainedViewState);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    
    // Calculate mouse position relative to container for zoom center
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const centerPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      handleZoom(delta, centerPoint);
    } else {
      handleZoom(delta);
    }
  };

  // Render polygon outline overlay from actual coordinates
  const renderBoundingBox = (location: ProcessedLocation, isSelected: boolean = false) => {
    // Use polygon_points if available, otherwise fallback to bounding_box
    if (!location.polygon_points && !location.bounding_box) return null;
    if (!imageSize.width || !imageSize.height) return null;

    const isHovered = hoveredLocation?.id === location.id;

    // Uniform color system for all entity types - đồng nhất cho tất cả loại
    const getColors = (type: string, selected: boolean, hovered: boolean) => {
      // Sử dụng cùng một bộ màu xanh dương cho tất cả loại entity với nét mảnh hơn
      const uniformColors = {
        stroke: selected ? '#2563eb' : hovered ? '#3b82f6' : '#93c5fd',
        strokeWidth: selected ? 0.3 : hovered ? 0.2 : 0.1  // Giảm độ dày nét xuống để mảnh hơn
      };
      return uniformColors;
    };

    const colors = getColors(location.type, isSelected, isHovered);

    let polygonPoints: Point[];
    let boundingBoxForClick: BoundingBox;

    if (location.polygon_points && location.polygon_points.length > 0) {
      // Convert actual polygon coordinates to image coordinates
      const scaleX = imageSize.width / MAP_DIMENSIONS.width;
      const scaleY = imageSize.height / MAP_DIMENSIONS.height;
      
      polygonPoints = location.polygon_points.map(point => ({
        x: point.x * scaleX,
        y: point.y * scaleY
      }));

      // Calculate bounding box for click area from polygon points
      const xs = polygonPoints.map(p => p.x);
      const ys = polygonPoints.map(p => p.y);
      boundingBoxForClick = {
        x_min: Math.min(...xs),
        y_min: Math.min(...ys),
        x_max: Math.max(...xs),
        y_max: Math.max(...ys)
      };
    } else {
      // Fallback to bounding box if no polygon points
      const imageBbox = mapBoundingBoxToImage(
        location.bounding_box!,
        MAP_DIMENSIONS,
        imageSize
      );
      
      polygonPoints = [
        { x: imageBbox.x_min, y: imageBbox.y_min }, // Top-left
        { x: imageBbox.x_max, y: imageBbox.y_min }, // Top-right  
        { x: imageBbox.x_max, y: imageBbox.y_max }, // Bottom-right
        { x: imageBbox.x_min, y: imageBbox.y_max }  // Bottom-left
      ];
      
      boundingBoxForClick = imageBbox;
    }

    const pointsString = polygonPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <div
        key={location.id}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: isSelected ? 30 : isHovered ? 20 : 10 }}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: imageSize.width,
            height: imageSize.height
          }}
        >
          {/* Polygon outline */}
          <polygon
            points={pointsString}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={colors.strokeWidth}
            strokeDasharray={isSelected ? "none" : isHovered ? "2,1" : "1,1"}
            className="transition-all duration-300"
          />
        </svg>

        {/* Interactive overlay for click detection */}
        <div
          className="absolute cursor-pointer transition-all duration-300"
          style={{
            left: boundingBoxForClick.x_min,
            top: boundingBoxForClick.y_min,
            width: boundingBoxForClick.x_max - boundingBoxForClick.x_min,
            height: boundingBoxForClick.y_max - boundingBoxForClick.y_min,
            pointerEvents: 'auto'
          }}
          onMouseEnter={() => setHoveredLocation(location)}
          onMouseLeave={() => setHoveredLocation(null)}
          onClick={(e) => {
            e.stopPropagation();
            onLocationClick?.(location);
          }}
          title={location.name}
        />

      </div>
    );
  };

  return (
    <div 
      className={`relative bg-gray-100 overflow-hidden ${className}`} 
      ref={containerRef}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {/* Map Image */}
      <div
        className={`relative w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          transform: `translate(${viewState.translateX}px, ${viewState.translateY}px) scale(${viewState.scale})`,
          transformOrigin: '0 0',
          transition: isDragging || isAnimating ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src="/map.jpg"
          alt="Bản đồ dự án"
          className="max-w-none pointer-events-none select-none"
          style={{
            width: imageSize.width,
            height: imageSize.height
          }}
          onLoad={() => {
            if (imageRef.current && containerRef.current) {
              const containerRect = containerRef.current.getBoundingClientRect();
              setContainerBounds(containerRect);
              const imgNaturalRatio = MAP_DIMENSIONS.width / MAP_DIMENSIONS.height;
              const containerRatio = containerRect.width / containerRect.height;
              
              // Tính toán để zoom 100% sẽ fit tối đa với container
              let displayWidth, displayHeight;
              if (imgNaturalRatio > containerRatio) {
                // Image rộng hơn container - fit width để tối ưu hóa không gian
                displayWidth = containerRect.width;
                displayHeight = displayWidth / imgNaturalRatio;
              } else {
                // Image cao hơn container - fit height để tối ưu hóa không gian
                displayHeight = containerRect.height;
                displayWidth = displayHeight * imgNaturalRatio;
              }
              
              setImageSize({ width: displayWidth, height: displayHeight });
            }
          }}
        />

        {/* Polygon Outline Overlays */}
        <>
          {/* Highlighted locations */}
          {highlightedLocations.map(location => renderBoundingBox(location, false))}
          
          {/* Selected location */}
          {selectedLocation && renderBoundingBox(selectedLocation, true)}
        </>
      </div>

      {/* Arrow Pointers for off-screen locations */}
      {containerBounds && imageSize.width && (
        <>
          {/* Highlighted locations arrows */}
          {highlightedLocations.map(location => {
            if (!location.polygon_points && !location.bounding_box) return null;
            
            let center: Point;
            if (location.polygon_points && location.polygon_points.length > 0) {
              const scaleX = imageSize.width / MAP_DIMENSIONS.width;
              const scaleY = imageSize.height / MAP_DIMENSIONS.height;
              const imagePolygonPoints = location.polygon_points.map(point => ({
                x: point.x * scaleX,
                y: point.y * scaleY
              }));
              center = getPolygonCentroid(imagePolygonPoints);
            } else {
              const imageBbox = mapBoundingBoxToImage(location.bounding_box!, MAP_DIMENSIONS, imageSize);
              center = getBoundingBoxCenter(imageBbox);
            }
            
            return (
              <ArrowPointer
                key={`arrow-${location.id}`}
                location={location}
                center={center}
                containerBounds={containerBounds}
                viewState={viewState}
                onClick={onLocationClick}
              />
            );
          })}
          
          {/* Selected location arrow */}
          {selectedLocation && (selectedLocation.polygon_points || selectedLocation.bounding_box) && (
            (() => {
              let center: Point;
              if (selectedLocation.polygon_points && selectedLocation.polygon_points.length > 0) {
                const scaleX = imageSize.width / MAP_DIMENSIONS.width;
                const scaleY = imageSize.height / MAP_DIMENSIONS.height;
                const imagePolygonPoints = selectedLocation.polygon_points.map(point => ({
                  x: point.x * scaleX,
                  y: point.y * scaleY
                }));
                center = getPolygonCentroid(imagePolygonPoints);
              } else {
                const imageBbox = mapBoundingBoxToImage(selectedLocation.bounding_box!, MAP_DIMENSIONS, imageSize);
                center = getBoundingBoxCenter(imageBbox);
              }
              
              return (
                <ArrowPointer
                  key={`arrow-selected-${selectedLocation.id}`}
                  location={selectedLocation}
                  center={center}
                  containerBounds={containerBounds}
                  viewState={viewState}
                  onClick={onLocationClick}
                />
              );
            })()
          )}
        </>
      )}

      {/* Enhanced Control Panel */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border divide-y">
        {/* Zoom Controls */}
        <div className="p-2 space-y-1">
          <button
            onClick={() => handleZoom(0.2)}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
        
        {/* View Controls */}
        <div className="p-2 space-y-1">
          <button
            onClick={handleFitToView}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
            title="Vừa màn hình"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
            title="Đặt lại (0)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* Interactive Zoom Display - Always visible in bottom right corner */}
      <div 
        className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm rounded-lg px-3 py-2 z-50 shadow-lg min-w-[80px] max-w-[120px]"
        style={{ 
          transform: 'translate(0, 0)', // Ensure proper positioning
          willChange: 'transform' // Optimize for layout changes
        }}
      >
        <div className="flex items-center gap-2 text-sm text-white">
          <input
            type="text"
            value={zoomInput || Math.round(viewState.scale * 100).toString()}
            onChange={(e) => setZoomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = parseInt(zoomInput);
                if (!isNaN(value) && value >= 100 && value <= 1500) {
                  setViewState(prev => constrainViewState({ ...prev, scale: value / 100 }));
                }
                setZoomInput('');
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                setZoomInput('');
                e.currentTarget.blur();
              }
            }}
            onBlur={() => setZoomInput('')}
            onFocus={(e) => e.target.select()}
            className="w-12 text-center bg-transparent border-none outline-none text-white font-medium text-sm"
            placeholder="100"
            title="Click để chỉnh zoom"
          />
          <span className="text-white/90 text-sm font-medium">%</span>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute top-4 left-4 bg-black/80 text-white rounded-lg p-2 text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <div className="space-y-1">
          <div><kbd>+/-</kbd> Zoom in/out</div>
          <div><kbd>0</kbd> Reset view</div>
          <div><kbd>←→↑↓</kbd> Pan map</div>
          <div><kbd>Mouse wheel</kbd> Zoom</div>
        </div>
      </div>

      {/* Loading indicator */}
      {!imageSize.width && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải bản đồ...</p>
          </div>
        </div>
      )}
    </div>
  );
});

MapViewer.displayName = 'MapViewer';

export default MapViewer;
