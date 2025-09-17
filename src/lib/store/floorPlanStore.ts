import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FloorPlanState {
  selectedFloor: string;
  selectedApartment: string;
  autoSelectFromChat: (floor: string, apartment: string) => void;
  setSelectedFloor: (floor: string) => void;
  setSelectedApartment: (apartment: string) => void;
}

export const useFloorPlanStore = create<FloorPlanState>()(
  devtools((set) => ({
    selectedFloor: 'tang-2',
    selectedApartment: '',
    
    autoSelectFromChat: (floor: string, apartment: string) => {
      console.log('Auto selecting from chat:', { floor, apartment });
      
      // Xử lý logic floor selection
      let targetFloor = 'tang-2'; // default
      
      if (floor === '0') {
        // Không xử lý gì cả, giữ nguyên floor hiện tại
        console.log('Floor is 0, no changes');
        return;
      } else if (floor === '2') {
        targetFloor = 'tang-2';
      } else if (floor && parseInt(floor) >= 3 && parseInt(floor) <= 29) {
        targetFloor = 'tang-3-29';
      }
      
      // Chuyển đổi apartment format từ "S6.06 3" thành "CH03"
      let targetApartment = '';
      if (apartment) {
        // Extract số từ apartment string (ví dụ: "S6.06 3" -> "3")
        const match = apartment.match(/(\d+)$/);
        if (match) {
          const apartmentNumber = parseInt(match[1]);
          targetApartment = `CH${apartmentNumber.toString().padStart(2, '0')}`;
        }
      }
      
      console.log('Setting:', { targetFloor, targetApartment });
      
      set({
        selectedFloor: targetFloor,
        selectedApartment: targetApartment
      });
    },
    
    setSelectedFloor: (floor: string) => 
      set({ selectedFloor: floor }),
      
    setSelectedApartment: (apartment: string) => 
      set({ selectedApartment: apartment })
  }))
);