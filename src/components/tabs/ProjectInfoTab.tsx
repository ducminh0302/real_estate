'use client';

import React, { useState, useEffect } from 'react';
import { useSearch } from '@/components/layout/SearchContext';

interface Apartment {
  apartment_number: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  dt_tim_tuong: number;
  dt_thong_thuy: number;
  tong_gia_truoc_vat_kpbt: number;
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
  }, [data, zoneFilter, buildingFilter, apartmentFilter, searchTerm]);

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
    return data?.status_definitions?.[status] || { label: status, color: '#000000' };
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header với thông tin tổng quan */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Thông tin dự án bất động sản</h1>
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="border-b border-gray-200 p-4 bg-gray-50 flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Container cố định cho tiêu đề */}
        <div className="bg-gray-100 sticky top-0 z-10">
          <div className="flex px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-h-[60px] items-center">
            <div className="flex-[0_0_10%] leading-tight">Số căn hộ</div>
            <div className="flex-[0_0_16%] leading-tight">Tên khu vực</div>
            <div className="flex-[0_0_8%] leading-tight">Tòa nhà</div>
            <div className="flex-[0_0_9%] leading-tight">Số tầng</div>
            <div className="flex-[0_0_10%] leading-tight">Diện tích<br/>sử dụng</div>
            <div className="flex-[0_0_10%] leading-tight">Diện tích<br/>tim tường</div>
            <div className="flex-[0_0_10%] leading-tight">Diện tích<br/>thông thủy</div>
            <div className="flex-[0_0_14%] leading-tight">Số phòng<br/>(ngủ/tắm)</div>
            <div className="flex-[0_0_13%] leading-tight">Tổng giá trước<br/>VAT + KPBT</div>
          </div>
        </div>
        
        {/* Nội dung bảng */}
        <div className="divide-y divide-gray-200">
          {filteredApartments.map((item, index) => {
            const statusInfo = getStatusInfo(item.apartment.status);
            return (
              <div key={index} className="flex px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-[0_0_10%] text-sm font-semibold text-gray-900">
                  {item.apartment.apartment_number}
                </div>
                <div className="flex-[0_0_16%] text-sm text-gray-600">
                  {item.zone}
                </div>
                <div className="flex-[0_0_8%] text-sm text-gray-600">
                  {item.building}
                </div>
                <div className="flex-[0_0_9%] text-sm text-gray-600">
                  {item.apartment.floor}
                </div>
                <div className="flex-[0_0_10%] text-sm text-gray-600">
                  <span className="font-medium">{formatNumber(item.apartment.area)}</span> m²
                </div>
                <div className="flex-[0_0_10%] text-sm text-gray-600">
                  <span className="font-medium">{formatNumber(item.apartment.dt_tim_tuong)}</span> m²
                </div>
                <div className="flex-[0_0_10%] text-sm text-gray-600">
                  <span className="font-medium">{formatNumber(item.apartment.dt_thong_thuy)}</span> m²
                </div>
                <div className="flex-[0_0_14%] text-sm text-gray-600">
                  <span className="font-medium">{item.apartment.bedrooms}</span> ngủ / <span className="font-medium">{item.apartment.bathrooms}</span> tắm
                </div>
                <div className="flex-[0_0_13%] text-sm text-gray-600">
                  <div className="font-semibold text-gray-900">{formatCurrency(item.apartment.tong_gia_truoc_vat_kpbt)}</div>
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