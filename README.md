# Real Estate Chat Interface

Một ứng dụng web hiện đại được xây dựng với Next.js để tra cứu thông tin bất động sản qua chat interface với khả năng xem bản đồ tương tác và thông tin chi tiết các căn hộ.

## ✨ Tính năng

- 🤖 **Chat Interface thông minh** - Tương tác qua AI để tìm kiếm thông tin
- 🗺️ **Bản đồ tương tác** - Xem vị trí và zoom, pan trên bản đồ dự án
- 🏢 **Thông tin chi tiết căn hộ** - Dữ liệu đầy đủ về giá, diện tích, vị trí
- 📊 **Bảng thông tin** - Hiển thị bảng dữ liệu với khả năng tìm kiếm và lọc
- 🏗️ **Mặt bằng tầng** - Xem chi tiết mặt bằng từng tầng
- 📱 **Responsive Design** - Tối ưu cho mọi thiết bị

## 🚀 Công nghệ sử dụng

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Turbopack

## 🛠️ Cài đặt và chạy

### 1. Clone repository

```bash
git clone https://github.com/your-username/real-estate-chat.git
cd real-estate-chat
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Thiết lập environment variables

```bash
cp .env.example .env.local
```

Cập nhật các biến môi trường trong file `.env.local` nếu cần thiết.

### 4. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

### 5. Build production

```bash
npm run build
npm start
```

## 📁 Cấu trúc dự án

```
src/
├── app/                    # App Router (Next.js 13+)
│   ├── api/               # API Routes
│   │   ├── chat/          # Chat API endpoint
│   │   └── real-estate/   # Real estate data API
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── chat/             # Chat related components
│   ├── layout/           # Layout components
│   ├── map/              # Map components
│   ├── search/           # Search components
│   ├── tabs/             # Tab components
│   └── ui/               # UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   └── store/            # Zustand stores
└── types/                # TypeScript type definitions

public/
├── data/                 # JSON data files
│   ├── final_labels.json     # Apartment details
│   ├── map_normalized.json   # Map data
│   └── real-estate-data.json # Main data
├── map.jpg              # Project map image
└── *.jpg                # Floor plan images
```

## 🎯 Các tính năng chính

### Chat Interface
- Giao diện chat hiện đại với AI
- Lịch sử chat được lưu trữ
- Trả lời thông minh dựa trên dữ liệu bất động sản

### Bản đồ tương tác
- Zoom in/out, pan với mouse/touch
- Hiển thị vị trí căn hộ trên bản đồ
- Click để xem thông tin chi tiết

### Tìm kiếm phân cấp
- Tìm kiếm theo tòa nhà, tầng, căn hộ
- Auto-complete suggestions
- Breadcrumb navigation

### Quản lý dữ liệu
- Import dữ liệu từ JSON files
- Xử lý và chuẩn hóa dữ liệu
- Cache để tối ưu hiệu suất

## 🔧 Scripts

- `npm run dev` - Chạy development server với Turbopack
- `npm run build` - Build production với optimizations
- `npm run start` - Chạy production server
- `npm run lint` - Chạy ESLint để kiểm tra code quality

## 🌐 Deploy

### Vercel (Khuyến nghị)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/real-estate-chat)

1. Push code lên GitHub repository
2. Kết nối repository với Vercel
3. Deploy tự động với mỗi commit

### Manual Deploy

```bash
npm run build
```

Upload thư mục `.next`, `public` và các file config cần thiết lên hosting provider.

## 📊 Dữ liệu

Dự án sử dụng các file dữ liệu JSON được đặt trong `/public/data/`:

- `final_labels.json` - Thông tin chi tiết từng căn hộ (giá, diện tích, etc.)
- `map_normalized.json` - Dữ liệu tọa độ bản đồ đã chuẩn hóa
- `real-estate-data.json` - Dữ liệu tổng hợp bất động sản

## 🔧 Customization

### Thêm dữ liệu mới
1. Cập nhật file JSON trong `/public/data/`
2. Chạy lại `npm run dev` để reload data

### Thay đổi giao diện
- Chỉnh sửa Tailwind classes trong components
- Cập nhật file `tailwind.config.js` cho custom theme

### Tích hợp AI/Chat API
- Cập nhật `/src/app/api/chat/route.ts`
- Thêm environment variables cho API keys

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- Email: [your-email@example.com](mailto:your-email@example.com)
- Project Link: [https://github.com/your-username/real-estate-chat](https://github.com/your-username/real-estate-chat)
- Live Demo: [https://real-estate-chat.vercel.app](https://real-estate-chat.vercel.app)

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vercel](https://vercel.com/)
