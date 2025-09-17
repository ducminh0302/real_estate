import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Giả lập hàm xử lý chat với dữ liệu bất động sản
export async function POST(request: NextRequest) {
  try {
    const { sessionId, chatInput } = await request.json();

    if (!chatInput) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tin nhắn' },
        { status: 400 }
      );
    }

    // Đọc dữ liệu bất động sản từ files
    const dataPath = path.join(process.cwd(), 'public', 'data');
    const finalLabelsPath = path.join(dataPath, 'final_labels.json');
    const mapNormalizedPath = path.join(dataPath, 'map_normalized.json');
    const realEstateDataPath = path.join(dataPath, 'real-estate-data.json');

    let finalLabels = [];
    let mapNormalized = [];
    let realEstateData = [];

    // Đọc dữ liệu nếu tồn tại
    if (fs.existsSync(finalLabelsPath)) {
      finalLabels = JSON.parse(fs.readFileSync(finalLabelsPath, 'utf-8'));
    }

    if (fs.existsSync(mapNormalizedPath)) {
      mapNormalized = JSON.parse(fs.readFileSync(mapNormalizedPath, 'utf-8'));
    }

    if (fs.existsSync(realEstateDataPath)) {
      realEstateData = JSON.parse(fs.readFileSync(realEstateDataPath, 'utf-8'));
    }

    // Xử lý câu hỏi đơn giản dựa trên từ khóa
    const output = processChat(chatInput, finalLabels, mapNormalized, realEstateData);
    
    // Tìm object data nếu có
    const objectData = findRelevantObjectData(chatInput, finalLabels, mapNormalized);

    return NextResponse.json({
      output: output,
      object: objectData ? JSON.stringify(objectData) : null,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}

function processChat(input: string, finalLabels: any[], mapNormalized: any[], realEstateData: any[]) {
  const lowercaseInput = input.toLowerCase();
  
  // Tìm kiếm tòa nhà
  if (lowercaseInput.includes('tòa') || lowercaseInput.includes('toa')) {
    const buildings = finalLabels.filter(item => 
      item.text && (item.text.includes('Tòa') || item.text.match(/^[A-Z]\d+/))
    );
    
    if (buildings.length > 0) {
      const buildingList = buildings.map(b => b.text).join(', ');
      return `Tôi tìm thấy các tòa nhà sau trong dự án: ${buildingList}. Bạn có muốn biết thêm thông tin về tòa nào cụ thể không?`;
    }
  }

  // Tìm kiếm phân khu
  if (lowercaseInput.includes('phân khu') || lowercaseInput.includes('phan khu')) {
    const districts = finalLabels.filter(item => 
      item.text && item.text.includes('Phân khu')
    );
    
    if (districts.length > 0) {
      const districtList = districts.map(d => d.text).join(', ');
      return `Các phân khu trong dự án bao gồm: ${districtList}. Bạn muốn tìm hiểu về phân khu nào?`;
    }
  }

  // Tìm kiếm căn hộ
  if (lowercaseInput.includes('căn hộ') || lowercaseInput.includes('can ho') || lowercaseInput.includes('apartment')) {
    const apartments = finalLabels.filter(item => 
      item.text && item.text.match(/\d+\.\d+/)
    );
    
    if (apartments.length > 0) {
      return `Tôi tìm thấy ${apartments.length} căn hộ trong dự án. Bạn có muốn xem thông tin chi tiết về căn hộ cụ thể nào không? Hãy cho tôi biết mã căn hộ.`;
    }
  }

  // Tìm kiếm theo mã cụ thể (như S6.06)
  const codeMatch = input.match(/([A-Z]\d+\.\d+)/);
  if (codeMatch) {
    const code = codeMatch[1];
    const found = finalLabels.find(item => 
      item.text && item.text.includes(code)
    );
    
    if (found) {
      return `Tôi đã tìm thấy thông tin về ${code}. Đây là một căn hộ trong dự án. Bạn có muốn xem sơ đồ mặt bằng hoặc thông tin chi tiết không?`;
    }
  }

  // Câu hỏi chung về dự án
  if (lowercaseInput.includes('dự án') || lowercaseInput.includes('du an') || lowercaseInput.includes('project')) {
    return `Đây là dự án bất động sản với nhiều tòa nhà và căn hộ. Tôi có thể giúp bạn tìm hiểu về:
    
• Thông tin các tòa nhà
• Thông tin các phân khu  
• Chi tiết căn hộ
• Sơ đồ mặt bằng

Bạn muốn tìm hiểu về điều gì cụ thể?`;
  }

  // Mặc định
  return `Tôi là trợ lý tư vấn bất động sản. Tôi có thể giúp bạn tìm hiểu về:

• Thông tin các tòa nhà trong dự án
• Chi tiết các căn hộ
• Sơ đồ và vị trí
• Thông tin phân khu

Bạn có câu hỏi gì về dự án không?`;
}

function findRelevantObjectData(input: string, finalLabels: any[], mapNormalized: any[]) {
  const lowercaseInput = input.toLowerCase();
  
  // Tìm object data dựa trên từ khóa
  if (lowercaseInput.includes('tòa') || lowercaseInput.includes('phân khu') || lowercaseInput.includes('căn hộ')) {
    // Trả về một object mẫu để hiển thị thông tin
    return {
      type: 'building_info',
      data: finalLabels.slice(0, 5), // Lấy 5 items đầu tiên để test
      coordinates: mapNormalized.slice(0, 5)
    };
  }

  return null;
}