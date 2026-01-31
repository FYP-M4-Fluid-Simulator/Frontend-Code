# CFD Airfoil Optimizer - Next.js

A high-fidelity Next.js application for wind turbine airfoil shape optimization with professional CFD-style visualizations. Built with the Next.js App Router for true page separation and optimal performance.

## 🎯 Features

### Three Independent Pages

#### 1. **Design Page** (`/design`)
- Interactive airfoil geometry editing
- CFD-style flow visualization with:
  - Rainbow pressure fields
  - Animated streamlines
  - Velocity vectors
- Real-time simulation controls
- Detailed metrics modal with charts

#### 2. **Optimize Page** (`/optimize`)
- Genetic algorithm-based shape optimization
- Real-time morphing airfoil animation
- Live flow field updates during optimization
- Comprehensive results with toggleable graphs
- Performance metrics tracking

#### 3. **Turbine Page** (`/turbine`)
- Industrial wind turbine visualization
- Professional technical flow field visualization
- Performance metrics dashboard
- Real-time performance adjustments

### Global Features
- 🔐 **User Authentication**: Prototype auth system with profile management
- 💾 **Design Saving**: Save and manage airfoil designs
- 🖥️ **Fullscreen Modes**: All visualizations support fullscreen
- 📱 **Responsive Design**: Works across all device sizes
- 📊 **Detailed Metrics**: Comprehensive charts and solver information

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or compatible runtime
- npm, yarn, or pnpm

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. The application will redirect to `/design` by default.

### Build for Production

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
/
├── app/
│   ├── layout.tsx           # Root layout with shared navigation
│   ├── page.tsx             # Home page (redirects to /design)
│   ├── providers.tsx        # Global state context
│   │
│   ├── design/              # 📄 DESIGN PAGE
│   │   ├── layout.tsx       # Page-specific layout & metadata
│   │   └── page.tsx         # Design page component
│   │
│   ├── optimize/            # 📄 OPTIMIZE PAGE
│   │   ├── layout.tsx       # Page-specific layout & metadata
│   │   └── page.tsx         # Optimize page component
│   │
│   └── turbine/             # 📄 TURBINE PAGE
│       ├── layout.tsx       # Page-specific layout & metadata
│       └── page.tsx         # Turbine page component
│
├── components/
│   ├── RootLayout.tsx       # Shared navigation wrapper
│   │
│   ├── TopBar.tsx           # Global navigation bar
│   ├── AuthModal.tsx        # Global auth modal
│   ├── SavedDesignsModal.tsx
│   ├── ProfileModal.tsx
│   ├── UserMenu.tsx
│   │
│   ├── AirfoilCanvas.tsx    # Design page components
│   ├── FlowVisualization.tsx
│   ├── SimulationControls.tsx
│   ├── MetricsModal.tsx
│   │
│   ├── OptimizationInput.tsx      # Optimize page components
│   ├── OptimizationAnimation.tsx
│   ├── OptimizationResults.tsx
│   │
│   └── ProfessionalTurbine.tsx    # Turbine page component
│
├── styles/
│   └── globals.css          # Global styles with Tailwind v4
│
├── ARCHITECTURE.md          # Detailed architecture documentation
└── next.config.js           # Next.js configuration
```

## 🔀 Routing

The application uses Next.js App Router with three main routes:

```
/              → Redirects to /design
/design        → Airfoil design and simulation
/optimize      → Shape optimization
/turbine       → Wind turbine visualization
```

### Navigation

- **Client-side routing**: Fast navigation between pages
- **Tab-based navigation**: Switch pages via the top navigation bar
- **Direct URL access**: All routes accessible via direct links
- **Page isolation**: Each page maintains its own state

## 🏗️ Architecture

### Page Separation

Each page is **completely independent**:

1. ✅ Separate route folders (`/design`, `/optimize`, `/turbine`)
2. ✅ Individual `page.tsx` files for each feature
3. ✅ Page-specific layouts with unique metadata
4. ✅ Dedicated components per page
5. ✅ Local state management within pages
6. ✅ Clean unmounting when navigating away

### State Management

**Global State** (via React Context in `/app/providers.tsx`):
- User authentication
- Lift-to-drag ratio (shared across pages)
- Simulation state (Design page)

**Page-Specific State** (local to each page):
- Fullscreen toggles
- Modal visibility
- Page-specific UI state

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) with App Router
- **UI Library**: [React 18+](https://react.dev/) with TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visualizations**: HTML5 Canvas API

## 🎨 Key Next.js Features Used

- ✅ **App Router**: Modern file-based routing
- ✅ **Server Components**: Layouts can be server-rendered
- ✅ **Client Components**: Interactive pages with `'use client'`
- ✅ **Metadata API**: SEO-friendly page titles and descriptions
- ✅ **TypeScript**: Full type safety
- ✅ **Code Splitting**: Automatic per-page bundle optimization

## 📖 Usage

### Design Page

1. Navigate to `/design` (default page)
2. Adjust airfoil parameters in the left sidebar
3. Click "Run CFD Simulation" to start simulation
4. Toggle between geometry and flow field views
5. View detailed metrics in the bottom panel
6. Click "View Detailed Metrics" for comprehensive charts

### Optimize Page

1. Navigate to `/optimize` via the top navigation
2. Set optimization parameters:
   - Target lift coefficient
   - Maximum drag constraint
   - Angle of attack range
   - Iterations and population size
3. Click "Start Optimization"
4. Watch real-time airfoil morphing animation
5. Review optimization results with interactive graphs
6. Toggle different chart views (convergence, shape evolution, etc.)

### Turbine Page

1. Navigate to `/turbine` via the top navigation
2. Adjust lift-to-drag ratio slider to see performance changes
3. Observe real-time updates to:
   - Rotation speed
   - Power output
   - Efficiency
   - Tip speed
4. View turbine specifications in the sidebar
5. Toggle fullscreen for immersive visualization

## 🔐 Authentication

Demo authentication is implemented:
- Click "Sign In" in the top-right corner
- Use any email/password combination to login (prototype only)
- Access user profile and saved designs after login

## 📝 Adding New Pages

To add a new page to the application:

1. Create a new folder in `/app/`, e.g., `/app/analysis/`
2. Add `page.tsx` for the page component
3. Add `layout.tsx` for page-specific metadata
4. Create page-specific components in `/components/`
5. Update `TopBar.tsx` to add navigation
6. Update `RootLayout.tsx` for route detection

## 🤝 Contributing

This is a demonstration application showcasing Next.js App Router architecture for complex engineering applications.

## 📄 License

MIT

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)