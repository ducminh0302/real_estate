'use client';

import React, { useState, useEffect } from 'react';
import { useSearch } from '@/components/layout/SearchContext';

interface Apartment {
  apartment_number: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  price_per_m2: number;
  status: string;
  direction: string;
}

interface Building {
  building_name: string;
  floors: number;
  apartments: Record<string, Apartment>;
}

interface Zone {
  zone_name: string;
  description: string;
  buildings: Record<string, Building>;
}

interface StatusDefinition {
  label: string;
  description: string;
  color: string;
}

interface Metadata {
  total_buildings: number;
  total_apartments: number;
  available_count: number;
  reserved_count: number;
  sold_count: number;
  price_range: {
    min: number;
    max: number;
  };
  area_range: {
    min: number;
    max: number;
  };
  last_updated: string;
}

interface RealEstateData {
  zones: Record<string, Zone>;
  status_definitions: Record<string, StatusDefinition>;
  metadata: Metadata;
}

interface ProjectInfoTabProps {
  mapDimensions?: { mapWidth: number; searchWidth: number };
}

export default function ProjectInfoTab({ mapDimensions }: ProjectInfoTabProps) {
  const [data, setData] = useState<RealEstateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredApartments, setFilteredApartments] = useState<{apartment: Apartment, building: string, zone: string}[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [apartmentFilter, setApartmentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const { searchTerm: globalSearchTerm } = useSearch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/real-estate-data.json');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const jsonData: RealEstateData = await response.json();
        setData(jsonData);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải dữ liệu dự án');
        setLoading(false);
        console.error(err);
      }
    };

    fetchData();
  }, []);

  // Khi globalSearchTerm thay đổi, cập nhật local searchTerm
  useEffect(() => {
    if (globalSearchTerm) {
      setSearchTerm(globalSearchTerm);
    }
  }, [globalSearchTerm]);

  // Get unique zones
  const getUniqueZones = () => {
    if (!data) return [];
    return Object.keys(data.zones);
  };

  // Get buildings based on selected zone
  const getBuildingsForZone = (zoneName: string) => {
    if (!data || zoneName === 'all') {
      // If no zone selected, return all buildings
      const buildings: string[] = [];
      if (data) {
        Object.values(data.zones).forEach(zone => {
          Object.values(zone.buildings).forEach(building => {
            if (!buildings.includes(building.building_name)) {
              buildings.push(building.building_name);
            }
          });
        });
      }
      return buildings;
    }
    
    // Return buildings for specific zone
    const zone = data.zones[zoneName];
    if (!zone) return [];
    
    return Object.values(zone.buildings).map(building => building.building_name);
  };

  // Get apartments based on selected building
  const getApartmentsForBuilding = () => {
    if (!data || buildingFilter === 'all') {
      return [];
    }
    
    // Find the building and return its apartments
    for (const zone of Object.values(data.zones)) {
      for (const [buildingKey, building] of Object.entries(zone.buildings)) {
        if (building.building_name === buildingFilter) {
          return Object.values(building.apartments).map(apartment => apartment.apartment_number);
        }
      }
    }
    
    return [];
  };

  // Reset building filter when zone changes
  useEffect(() => {
    if (zoneFilter !== 'all') {
      // Get buildings for selected zone
      const buildingsInZone = getBuildingsForZone(zoneFilter);
      
      // If current building filter is not in this zone, reset it
      if (buildingFilter !== 'all' && !buildingsInZone.includes(buildingFilter)) {
        setBuildingFilter('all');
        setApartmentFilter('all'); // Also reset apartment filter
      }
    } else if (zoneFilter === 'all' && buildingFilter !== 'all') {
      // If zone is reset to all but building is still selected, reset apartment filter
      setApartmentFilter('all');
    }
  }, [zoneFilter, buildingFilter, data]);

  // Reset apartment filter when building changes
  useEffect(() => {
    if (buildingFilter !== 'all') {
      // Get apartments for selected building
      const apartmentsInBuilding = getApartmentsForBuilding();
      
      // If current apartment filter is not in this building, reset it
      if (apartmentFilter !== 'all' && !apartmentsInBuilding.includes(apartmentFilter)) {
        setApartmentFilter('all');
      }
    }
  }, [buildingFilter, apartmentFilter, data]);

  // Apply filters
  useEffect(() => {
    if (!data) {
      setFilteredApartments([]);
      return;
    }

    // Flatten apartments for filtering
    const allApartments: {apartment: Apartment, building: string, zone: string}[] = [];
    
    Object.entries(data.zones).forEach(([zoneKey, zone]) => {
      Object.entries(zone.buildings).forEach(([buildingKey, building]) => {
        Object.entries(building.apartments).forEach(([apartmentKey, apartment]) => {
          allApartments.push({
            apartment,
            building: building.building_name,
            zone: zone.zone_name
          });
        });
      });
    });

    // Apply filters
    let result = allApartments;
    
    if (statusFilter !== 'all') {
      result = result.filter(item => item.apartment.status === statusFilter);
    }

    if (zoneFilter !== 'all') {
      result = result.filter(item => item.zone === zoneFilter);
    }

    if (buildingFilter !== 'all') {
      result = result.filter(item => item.building === buildingFilter);
    }

    if (apartmentFilter !== 'all') {
      result = result.filter(item => item.apartment.apartment_number === apartmentFilter);
    }

    // Apply search term (search in apartment number, building name, and zone name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        item.apartment.apartment_number.toLowerCase().includes(term) ||
        item.building.toLowerCase().includes(term) ||
        item.zone.toLowerCase().includes(term)
      );
    }

    setFilteredApartments(result);
  }, [data, statusFilter, zoneFilter, buildingFilter, apartmentFilter, searchTerm]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Đang tải thông tin dự án...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Không có dữ liệu</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getStatusInfo = (status: string) => {
    return data.status_definitions[status] || { label: status, color: '#000000' };
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header với thông tin tổng quan */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Thông tin dự án bất động sản</h1>
          </div>
          
          {/* Thông tin tổng quan */}
          <div className="flex gap-2 flex-shrink-0">
            <div className="bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100 min-w-[90px]">
              <div className="text-xs text-gray-500">Tổng số căn hộ</div>
              <div className="text-base font-bold text-gray-800">{data.metadata.total_apartments}</div>
            </div>
            <div className="bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100 min-w-[90px]">
              <div className="text-xs text-gray-500">Còn trống</div>
              <div className="text-base font-bold text-green-600">
                {data.metadata.available_count}
              </div>
            </div>
            <div className="bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100 min-w-[90px]">
              <div className="text-xs text-gray-500">Đã đặt cọc</div>
              <div className="text-base font-bold text-amber-600">
                {data.metadata.reserved_count}
              </div>
            </div>
            <div className="bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100 min-w-[90px]">
              <div className="text-xs text-gray-500">Đã bán</div>
              <div className="text-base font-bold text-rose-600">
                {data.metadata.sold_count}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="border-b border-gray-200 p-4 bg-gray-50 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select 
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(data.status_definitions).map(([key, status]) => (
                <option key={key} value={key}>{status.label}</option>
              ))}
            </select>
          </div>
          
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
            <select 
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              <option value="all">Tất cả khu vực</option>
              {getUniqueZones().map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>
          
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tòa nhà</label>
            <select 
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
            >
              <option value="all">Tất cả tòa nhà</option>
              {getBuildingsForZone(zoneFilter).map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          </div>
          
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Căn hộ</label>
            <select 
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={apartmentFilter}
              onChange={(e) => setApartmentFilter(e.target.value)}
              disabled={buildingFilter === 'all'}
            >
              <option value="all">Tất cả căn hộ</option>
              {getApartmentsForBuilding().map(apartment => (
                <option key={apartment} value={apartment}>{apartment}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="w-3/7 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Tìm theo tên căn hộ, tòa nhà, khu vực..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="text-sm text-gray-500 whitespace-nowrap pb-1">
            Hiển thị {filteredApartments.length} căn hộ
          </div>
        </div>
      </div>

      {/* Bảng thông tin căn hộ */}
      <div className="flex-1 overflow-auto">
        {/* Container cố định cho tiêu đề */}
        <div className="bg-gray-100 sticky top-0 z-10">
          <div className="flex px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
            <div className="flex-[0_0_8.33%] whitespace-nowrap">Căn hộ</div>
            <div className="flex-[0_0_20.83%] whitespace-nowrap">Khu vực</div>
            <div className="flex-[0_0_8.33%] whitespace-nowrap">Tòa nhà</div>
            <div className="flex-[0_0_8.33%] whitespace-nowrap">Tầng</div>
            <div className="flex-[0_0_8.33%] whitespace-nowrap">Diện tích</div>
            <div className="flex-[0_0_16.66%] whitespace-nowrap">Phòng</div>
            <div className="flex-[0_0_16.66%] whitespace-nowrap">Giá</div>
            <div className="flex-[0_0_12.5%] whitespace-nowrap">Trạng thái</div>
          </div>
        </div>
        
        {/* Nội dung bảng */}
        <div className="divide-y divide-gray-200">
          {filteredApartments.map((item, index) => {
            const statusInfo = getStatusInfo(item.apartment.status);
            return (
              <div key={index} className="flex px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-[0_0_8.33%] text-sm font-semibold text-gray-900">
                  {item.apartment.apartment_number}
                </div>
                <div className="flex-[0_0_20.83%] text-sm text-gray-600">
                  {item.zone}
                </div>
                <div className="flex-[0_0_8.33%] text-sm text-gray-600">
                  {item.building}
                </div>
                <div className="flex-[0_0_8.33%] text-sm text-gray-600">
                  {item.apartment.floor}
                </div>
                <div className="flex-[0_0_8.33%] text-sm text-gray-600">
                  <span className="font-medium">{formatNumber(item.apartment.area)}</span> m²
                </div>
                <div className="flex-[0_0_16.66%] text-sm text-gray-600">
                  <span className="font-medium">{item.apartment.bedrooms}</span> ngủ / <span className="font-medium">{item.apartment.bathrooms}</span> tắm
                </div>
                <div className="flex-[0_0_16.66%] text-sm text-gray-600">
                  <div className="font-semibold text-gray-900">{formatCurrency(item.apartment.price)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(item.apartment.price_per_m2)}/m²
                  </div>
                </div>
                <div className="flex-[0_0_12.5%]">
                  <span 
                    className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full"
                    style={{ 
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredApartments.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 text-xl">Không có căn hộ nào phù hợp với bộ lọc</div>
          </div>
        )}
      </div>
    </div>
  );
}