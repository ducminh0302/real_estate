# Deploy to GitHub and Vercel

## 📋 Checklist Deploy

### ✅ Đã hoàn thành:
- [x] Cài đặt tất cả dependencies (lucide-react, zustand, date-fns)
- [x] Build thành công
- [x] Tạo git repository
- [x] Commit code
- [x] Tạo vercel.json configuration
- [x] Tạo README.md chi tiết
- [x] Thiết lập remote origin

### 🚀 Bước tiếp theo:

#### 1. Push lên GitHub
```bash
git push -u origin main
```

#### 2. Deploy lên Vercel

**Option A: Sử dụng Vercel CLI (Khuyến nghị)**
```bash
npm install -g vercel
vercel login
vercel --prod
```

**Option B: Sử dụng Vercel Dashboard**
1. Truy cập https://vercel.com/dashboard
2. Click "New Project"
3. Import từ GitHub: `https://github.com/ducminh0302/real_estate`
4. Để mặc định tất cả settings (Vercel tự detect Next.js)
5. Click "Deploy"

#### 3. Environment Variables (Nếu cần)
Trong Vercel Dashboard > Settings > Environment Variables, thêm:
```
NEXT_PUBLIC_API_BASE_URL=https://your-vercel-app.vercel.app/api
```

## 🔗 Links sau khi deploy:
- GitHub Repo: https://github.com/ducminh0302/real_estate
- Vercel App: https://real-estate-[unique-id].vercel.app (sẽ được tạo tự động)

## 📊 Project Stats:
- Framework: Next.js 15 với Turbopack
- Components: 20+ React components
- Data files: 3 JSON files (50k+ dòng dữ liệu)
- Build size: ~2MB optimized
- Features: Chat, Interactive Map, Search, Floor Plans

## 🔧 Commands để chạy sau khi deploy:
```bash
# Xem logs
vercel logs

# Update deployment
git push origin main  # Auto deploy

# Local development
npm run dev
```
