import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Lấy headers để có thể gửi kèm trong request tới API của bạn
    const headers = {
      'Content-Type': 'application/json',
      // Thêm API key nếu có
      ...(process.env.API_KEY && { 'Authorization': `Bearer ${process.env.API_KEY}` }),
      // Lấy các custom headers từ request
      ...Object.fromEntries(
        [...request.headers.entries()].filter(([key]) => 
          key.startsWith('x-') || key === 'authorization'
        )
      ),
    };

    console.log('Chat API received:', { 
      body: { ...body, message: body.message?.substring(0, 100) + '...' }, // Log partial message
      headersCount: Object.keys(headers).length 
    });
    
    // Gọi đến API endpoint của bạn nếu đã cấu hình
    const apiEndpoint = process.env.YOUR_API_ENDPOINT;
    
    if (apiEndpoint && apiEndpoint !== 'http://localhost:3000/api/chat') {
      try {
        console.log('Calling external API:', apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const responseData = await response.json();
        return NextResponse.json(responseData, { status: 200 });
        
      } catch (error) {
        console.error('External API error:', error);
        return NextResponse.json(
          { 
            message: `Lỗi khi gọi API: ${error instanceof Error ? error.message : 'Unknown error'}`,
            isError: true,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }

    // Tạm thời trả về response mẫu để test
    const mockResponse = {
      message: `Tôi đã nhận được câu hỏi: "${body.message}". Hiện tại hệ thống đang sử dụng API mock. Bạn có thể cấu hình biến môi trường YOUR_API_ENDPOINT để kết nối với API thực tế của mình.`,
      timestamp: new Date().toISOString(),
      context: body.context || null,
    };

    return NextResponse.json(mockResponse, { status: 200 });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        message: 'Có lỗi xảy ra khi xử lý chat request',
        isError: true,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
