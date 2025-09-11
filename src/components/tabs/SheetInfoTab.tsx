'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Info, Building, BarChart3, TrendingUp, Search, Filter } from 'lucide-react';

interface Apartment {
  apartment_number: string;
  floor: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  price_per_m2: number;
  status: 'available' | 'reserved' | 'sold';
  direction: string;
  building_name: string;
  zone_name: string;
}

interface RealEstateData {
  project_info: {
    name: string;
    developer: string;
    location: string;
  };
  zones: {
    [zoneName: string]: {
      zone_name: string;
      description: string;
      buildings: {
        [buildingName: string]: {
          building_name: string;
          floors: number;
          apartments: {
            [apartmentId: string]: {
              apartment_number: string;
              floor: number;
              area: number;
              bedrooms: number;
              bathrooms: number;
              price: number;
              price_per_m2: number;
              status: 'available' | 'reserved' | 'sold';
              direction: string;
            };
          };
        };
      };
    };
  };
  status_definitions: {
    [status: string]: {
      label: string;
      description: string;
      color: string;
    };
  };
}

export default function SheetInfoTab() {
  const [data, setData] = useState<RealEstateData | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [stats, setStats] = useState<{
    totalApartments: number;
    totalBuildings: number;
    averageArea: number;
    averagePrice: number;
    averagePricePerM2: number;
    maxFloors: number;
    statusCounts: { [key: string]: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/data/real-estate-data.json');
        const jsonData: RealEstateData = await response.json();
        setData(jsonData);

        // Flatten dữ liệu thành mảng apartments
        const apartmentsList: Apartment[] = [];
        const buildings: Array<{ building_name: string; floors: number; apartments: Record<string, unknown> }> = [];
        const statusCounts: { [key: string]: number } = { available: 0, reserved: 0, sold: 0 };
        let maxFloors = 0;

        Object.values(jsonData.zones).forEach(zone => {
          Object.values(zone.buildings).forEach(building => {
            buildings.push(building);
            maxFloors = Math.max(maxFloors, building.floors);
            
            Object.values(building.apartments).forEach(apartment => {
              apartmentsList.push({
                ...apartment,
                building_name: building.building_name,
                zone_name: zone.zone_name
              });
              statusCounts[apartment.status]++;
            });
          });
        });

        setApartments(apartmentsList);
        setFilteredApartments(apartmentsList);

        const totalApartments = apartmentsList.length;
        const totalBuildings = buildings.length;
        const averageArea = apartmentsList.reduce((sum, apt) => sum + apt.area, 0) / totalApartments;
        const averagePrice = apartmentsList.reduce((sum, apt) => sum + apt.price, 0) / totalApartments;
        const averagePricePerM2 = apartmentsList.reduce((sum, apt) => sum + apt.price_per_m2, 0) / totalApartments;

        setStats({
          totalApartments,
          totalBuildings,
          averageArea,
          averagePrice,
          averagePricePerM2,
          maxFloors,
          statusCounts
        });
      } catch (error) {
        console.error('Error loading real estate data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter apartments based on search and filters
  useEffect(() => {
    let filtered = apartments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.apartment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.building_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.zone_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.direction.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Building filter
    if (buildingFilter !== 'all') {
      filtered = filtered.filter(apt => apt.building_name === buildingFilter);
    }

    setFilteredApartments(filtered);
  }, [searchTerm, statusFilter, buildingFilter, apartments]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatArea = (area: number) => {
    return `${area.toFixed(1)} m²`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: 'Còn trống', bg: 'bg-green-100', text: 'text-green-800' },
      reserved: { label: 'Đã đặt cọc', bg: 'bg-yellow-100', text: 'text-yellow-800' },
      sold: { label: 'Đã bán', bg: 'bg-red-100', text: 'text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const uniqueBuildings = [...new Set(apartments.map(apt => apt.building_name))].sort();

  if (loading || !data || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Thông tin bảng dữ liệu</h2>
            <p className="text-sm text-gray-600">{data.project_info.name} - {data.project_info.location}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalApartments}</div>
            <div className="text-sm text-gray-600">Tổng căn hộ</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.statusCounts.available}</div>
            <div className="text-sm text-gray-600">Còn trống</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.statusCounts.reserved}</div>
            <div className="text-sm text-gray-600">Đã đặt cọc</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.statusCounts.sold}</div>
            <div className="text-sm text-gray-600">Đã bán</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm căn hộ, tòa nhà..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Còn trống</option>
            <option value="reserved">Đã đặt cọc</option>
            <option value="sold">Đã bán</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
          >
            <option value="all">Tất cả tòa nhà</option>
            {uniqueBuildings.map(building => (
              <option key={building} value={building}>{building}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container - Scrollable */}
      <div className="flex-1 overflow-auto bg-white" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        <div className="min-w-full">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Căn hộ
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Tòa nhà
                </th>
                <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Tầng
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Diện tích
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Phòng
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Hướng
                </th>
                <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Giá bán
                </th>
                <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Giá/m²
                </th>
                <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApartments.map((apartment, index) => (
                <tr key={`${apartment.building_name}-${apartment.apartment_number}`} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate">
                    {apartment.apartment_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate">
                    {apartment.building_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate">
                    Tầng {apartment.floor}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate">
                    {formatArea(apartment.area)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate">
                    {apartment.bedrooms}PN, {apartment.bathrooms}WC
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate">
                    {apartment.direction}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate">
                    <div className="font-medium">{formatPrice(apartment.price)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 truncate">
                    {formatPrice(apartment.price_per_m2)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(apartment.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredApartments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy căn hộ nào phù hợp với bộ lọc
            </div>
          )}
        </div>
      </div>

      {/* Footer - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Hiển thị {filteredApartments.length} / {stats.totalApartments} căn hộ
          {searchTerm && ` - Tìm kiếm: "${searchTerm}"`}
          {statusFilter !== 'all' && ` - Trạng thái: ${statusFilter}`}
          {buildingFilter !== 'all' && ` - Tòa nhà: ${buildingFilter}`}
        </div>
      </div>
    </div>
  );
}
