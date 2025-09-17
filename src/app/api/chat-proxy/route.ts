import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward request đến ngrok URL
    const response = await fetch('https://traditive-maryrose-odorous.ngrok-free.app/webhook/7f553565-99f5-49fa-966b-2c3e44f84ced/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json(
      { 
        error: 'Không thể kết nối đến server chat',
        output: 'Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại sau.'
      },
      { status: 500 }
    );
  }
}