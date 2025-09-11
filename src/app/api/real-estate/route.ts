import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'districts', 'buildings', 'apartments'
    const search = searchParams.get('search');

    // Đọc dữ liệu từ files
    const dataPath = path.join(process.cwd(), 'public', 'data');
    const finalLabelsPath = path.join(dataPath, 'final_labels.json');
    const mapNormalizedPath = path.join(dataPath, 'map_normalized.json');

    if (!fs.existsSync(finalLabelsPath) || !fs.existsSync(mapNormalizedPath)) {
      return NextResponse.json(
        { error: 'Không tìm thấy dữ liệu bất động sản' },
        { status: 404 }
      );
    }

    const finalLabels = JSON.parse(fs.readFileSync(finalLabelsPath, 'utf-8'));
    const mapNormalized = JSON.parse(fs.readFileSync(mapNormalizedPath, 'utf-8'));

    // Lọc dữ liệu theo loại và tìm kiếm
    let result = finalLabels;
    
    if (type) {
      result = finalLabels.filter((item: Record<string, unknown>) => {
        switch (type) {
          case 'districts':
            return item.text && typeof item.text === 'string' && item.text.includes('Phân khu');
          case 'buildings':
            return item.text && typeof item.text === 'string' && (item.text.includes('Tòa') || item.text.match(/^[A-Z]\d+/));
          case 'apartments':
            return item.text && typeof item.text === 'string' && item.text.match(/\d+\.\d+/);
          default:
            return true;
        }
      });
    }

    if (search) {
      result = result.filter((item: Record<string, unknown>) => 
        item.text && typeof item.text === 'string' && item.text.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({
      data: result,
      total: result.length,
      type,
      search
    });

  } catch (error) {
    console.error('Real estate API error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy thông tin bất động sản' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Endpoint này có thể được sử dụng để gửi thông tin context về bất động sản
    // tới API của bạn kèm với chat messages
    
    console.log('Real estate context API received:', body);
    
    // TODO: Gọi đến API endpoint của bạn với context về bất động sản
    // const response = await fetch(process.env.YOUR_API_ENDPOINT, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     ...Object.fromEntries(
    //       [...request.headers.entries()].filter(([key]) => 
    //         key.startsWith('x-') || key === 'authorization'
    //       )
    //     ),
    //   },
    //   body: JSON.stringify(body),
    // });

    return NextResponse.json({
      message: "Context bất động sản đã được nhận",
      timestamp: new Date().toISOString(),
      context: body,
    });

  } catch (error) {
    console.error('Real estate context API error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xử lý context bất động sản' },
      { status: 500 }
    );
  }
}
