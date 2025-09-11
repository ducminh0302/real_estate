import { 
  Point, 
  BoundingBox, 
  MapData, 
  RealEstateData, 
  ProcessedLocation, 
  SearchResult 
} from '@/types';

/**
 * Chuyển đổi từ polygon coordinates thành bounding box
 */
export function coordinatesToBoundingBox(coordinates: Point[]): BoundingBox {
  if (coordinates.length === 0) {
    return { x_min: 0, y_min: 0, x_max: 0, y_max: 0 };
  }

  const xCoords = coordinates.map(p => p.x);
  const yCoords = coordinates.map(p => p.y);

  return {
    x_min: Math.min(...xCoords),
    y_min: Math.min(...yCoords),
    x_max: Math.max(...xCoords),
    y_max: Math.max(...yCoords)
  };
}

/**
 * Tính toán diện tích của bounding box
 */
export function getBoundingBoxArea(bbox: BoundingBox): number {
  return (bbox.x_max - bbox.x_min) * (bbox.y_max - bbox.y_min);
}

/**
 * Kiểm tra xem một điểm có nằm trong bounding box không
 */
export function isPointInBoundingBox(point: Point, bbox: BoundingBox): boolean {
  return point.x >= bbox.x_min && 
         point.x <= bbox.x_max && 
         point.y >= bbox.y_min && 
         point.y <= bbox.y_max;
}

/**
 * Tính toán trung tâm của bounding box
 */
export function getBoundingBoxCenter(bbox: BoundingBox): Point {
  return {
    x: (bbox.x_min + bbox.x_max) / 2,
    y: (bbox.y_min + bbox.y_max) / 2
  };
}

/**
 * Chuyển đổi tọa độ từ map coordinates sang image display coordinates
 */
export function mapToImageCoordinates(
  mapPoint: Point, 
  mapDimensions: { width: number; height: number },
  imageDimensions: { width: number; height: number }
): Point {
  return {
    x: (mapPoint.x / mapDimensions.width) * imageDimensions.width,
    y: (mapPoint.y / mapDimensions.height) * imageDimensions.height
  };
}

/**
 * Chuyển đổi bounding box từ map coordinates sang image coordinates
 */
export function mapBoundingBoxToImage(
  bbox: BoundingBox,
  mapDimensions: { width: number; height: number },
  imageDimensions: { width: number; height: number }
): BoundingBox {
  const topLeft = mapToImageCoordinates(
    { x: bbox.x_min, y: bbox.y_min },
    mapDimensions,
    imageDimensions
  );
  const bottomRight = mapToImageCoordinates(
    { x: bbox.x_max, y: bbox.y_max },
    mapDimensions,
    imageDimensions
  );

  return {
    x_min: topLeft.x,
    y_min: topLeft.y,
    x_max: bottomRight.x,
    y_max: bottomRight.y
  };
}

/**
 * Tạo expanded bounding box (để zoom với padding)
 */
export function expandBoundingBox(
  bbox: BoundingBox, 
  expansionPercent: number = 20
): BoundingBox {
  const width = bbox.x_max - bbox.x_min;
  const height = bbox.y_max - bbox.y_min;
  const xExpansion = width * (expansionPercent / 100) / 2;
  const yExpansion = height * (expansionPercent / 100) / 2;

  return {
    x_min: Math.max(0, bbox.x_min - xExpansion),
    y_min: Math.max(0, bbox.y_min - yExpansion),
    x_max: bbox.x_max + xExpansion,
    y_max: bbox.y_max + yExpansion
  };
}
