'use client';

import React from 'react';
import { useLocationSelection } from '@/components/layout/LocationSelectionContext';

interface ObjectData {
  zone_name: string | null;
  buildings: string | null;
  apartments: string | null;
}

interface ObjectInfoButtonProps {
  data: ObjectData[];
  onSearch: (searchTerm: string) => void;
}

// Hàm helper để xác định văn bản hiển thị và giá trị tìm kiếm
const getDisplayInfo = (item: ObjectData) => {
  let displayText = '';
  let searchTerm = '';
  
  if (item.apartments) {
    displayText = `Căn hộ ${item.apartments}`;
    searchTerm = item.apartments;
  } else if (item.buildings) {
    displayText = `Tòa nhà ${item.buildings}`;
    searchTerm = item.buildings;
  } else if (item.zone_name) {
    displayText = `Phân khu ${item.zone_name}`;
    searchTerm = item.zone_name || '';
  }
  
  return { displayText, searchTerm };
};

export default function ObjectInfoButton({ data, onSearch }: ObjectInfoButtonProps) {
  const { setSelectedLocation } = useLocationSelection();

  // Nếu không có dữ liệu, không hiển thị gì
  if (!data || data.length === 0) {
    return null;
  }

  // Lọc ra các item có ít nhất một trong các trường không null
  const validItems = data.filter(item => 
    item.apartments || item.buildings || item.zone_name
  );

  // Nếu không có item nào hợp lệ, không hiển thị gì
  if (validItems.length === 0) {
    return null;
  }

  const handleClick = (item: ObjectData) => {
    const { searchTerm } = getDisplayInfo(item);
    // Cập nhật ô tìm kiếm của tab "Thông tin dự án"
    onSearch(searchTerm);
    // Chọn vị trí trong tab bản đồ (điều hướng và zoom map)
    // Truyền toàn bộ item để HierarchicalSearch có thể xử lý đúng
    setSelectedLocation(item);
  };

  return (
    <div className="mt-2 space-y-2">
      {validItems.map((item, index) => {
        const { displayText } = getDisplayInfo(item);
        
        // Nếu không có gì để hiển thị, bỏ qua item này
        if (!displayText) {
          return null;
        }

        return (
          <button
            key={index}
            onClick={() => handleClick(item)}
            className="w-full text-left px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            {displayText}
          </button>
        );
      })}
    </div>
  );
}