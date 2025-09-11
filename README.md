# Real Estate Chat Interface

A modern web application built with Next.js for real estate information inquiry through chat interface with interactive map viewing and detailed apartment information.

## ✨ Features

- 🤖 **Intelligent Chat Interface** - AI-powered interactions for information search
- 🗺️ **Interactive Map** - View locations with zoom and pan capabilities on project map
- 🏢 **Detailed Apartment Information** - Complete data including price, area, location
- 📊 **Information Dashboard** - Data table display with search and filter capabilities
- 🏗️ **Floor Plans** - Detailed floor plan viewing for each level
- 📱 **Responsive Design** - Optimized for all devices

## 🚀 Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Turbopack

## 🛠️ Installation & Setup

### 1. Clone repository

```bash
git clone https://github.com/ducminh0302/real_estate.git
cd real_estate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env.local
```

Update environment variables in `.env.local` file if needed.

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Build for production

```bash
npm run build
npm start
```

## 📁 Project Structure

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

## 🎯 Core Features

### Chat Interface
- Modern chat UI with AI integration
- Persistent chat history
- Intelligent responses based on real estate data

### Interactive Map
- Zoom in/out, pan with mouse/touch
- Apartment location display on map
- Click for detailed information

### Hierarchical Search
- Search by building, floor, apartment
- Auto-complete suggestions
- Breadcrumb navigation

### Data Management
- JSON data file imports
- Data processing and normalization
- Caching for performance optimization

## 🔧 Available Scripts

- `npm run dev` - Run development server with Turbopack
- `npm run build` - Build for production with optimizations
- `npm run start` - Run production server
- `npm run lint` - Run ESLint for code quality checks

## 📊 Data Sources

The project uses JSON data files located in `/public/data/`:

- `final_labels.json` - Detailed apartment information (price, area, etc.)
- `map_normalized.json` - Normalized map coordinate data
- `real-estate-data.json` - Consolidated real estate data

## 🔧 Customization

### Adding New Data
1. Update JSON files in `/public/data/`
2. Restart development server to reload data

### UI Modifications
- Edit Tailwind classes in components
- Update `tailwind.config.js` for custom themes

### AI/Chat API Integration
- Update `/src/app/api/chat/route.ts`
- Add environment variables for API keys

