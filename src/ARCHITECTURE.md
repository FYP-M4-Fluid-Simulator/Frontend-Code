# Next.js Application Architecture

## Project Structure

```
cfd-airfoil-optimizer/
├── app/
│   ├── layout.tsx                 # Root layout (wraps all pages)
│   ├── page.tsx                   # Home page (redirects to /design)
│   ├── providers.tsx              # Global state context providers
│   │
│   ├── design/
│   │   ├── layout.tsx            # Design page layout & metadata
│   │   └── page.tsx              # DESIGN PAGE - Airfoil geometry & simulation
│   │
│   ├── optimize/
│   │   ├── layout.tsx            # Optimize page layout & metadata
│   │   └── page.tsx              # OPTIMIZE PAGE - Shape optimization
│   │
│   └── turbine/
│       ├── layout.tsx            # Turbine page layout & metadata
│       └── page.tsx              # TURBINE PAGE - Wind turbine visualization
│
├── components/
│   ├── RootLayout.tsx            # Shared navigation & modals wrapper
│   │
│   ├── TopBar.tsx                # Navigation bar (shared across all pages)
│   ├── AuthModal.tsx             # Authentication modal (global)
│   ├── SavedDesignsModal.tsx     # Saved designs modal (global)
│   ├── ProfileModal.tsx          # User profile modal (global)
│   ├── UserMenu.tsx              # User menu dropdown
│   │
│   ├── AirfoilCanvas.tsx         # Design page component
│   ├── FlowVisualization.tsx     # Design page component
│   ├── SimulationControls.tsx    # Design page component
│   ├── MetricsModal.tsx          # Design page component
│   │
│   ├── OptimizationInput.tsx     # Optimize page component
│   ├── OptimizationAnimation.tsx # Optimize page component
│   ├── OptimizationResults.tsx   # Optimize page component
│   │
│   └── ProfessionalTurbine.tsx   # Turbine page component
│
└── styles/
    └── globals.css               # Global styles with Tailwind v4
```

## Page Structure

### 1. Design Page (`/design`)

**Route**: `/design`

**Purpose**: Interactive airfoil geometry editing and CFD simulation

**Components**:
- `SimulationControls` - Left sidebar with simulation parameters
- `AirfoilCanvas` - Center canvas for airfoil geometry
- `FlowVisualization` - CFD flow field visualization
- `MetricsModal` - Detailed simulation metrics

**Page-Specific State**:
- `isFullscreen` - Fullscreen mode toggle
- `showMetricsModal` - Metrics modal visibility

**Global State Used**:
- `isSimulating` - Simulation running state
- `simulationComplete` - Simulation completion flag
- `showFlowField` - Toggle between geometry and flow field

---

### 2. Optimize Page (`/optimize`)

**Route**: `/optimize`

**Purpose**: Genetic algorithm-based airfoil shape optimization

**Components**:
- `OptimizationInput` - Input form for optimization parameters
- `OptimizationAnimation` - Real-time morphing animation
- `OptimizationResults` - Results display with graphs

**Page-Specific State**:
- `isOptimizing` - Optimization running state
- `optimizationComplete` - Optimization completion flag
- `isFullscreen` - Fullscreen mode for results

**Global State Used**:
- `liftToDragRatio` - Updated after optimization completes

**State Flow**:
```
Input Form → Animation (optimizing) → Results Display
```

---

### 3. Turbine Page (`/turbine`)

**Route**: `/turbine`

**Purpose**: Industrial wind turbine visualization with performance metrics

**Components**:
- `ProfessionalTurbine` - 3D turbine visualization with flow field
- Performance metrics sidebar

**Page-Specific State**:
- `isFullscreen` - Fullscreen mode toggle

**Global State Used**:
- `liftToDragRatio` - Controls turbine performance (read/write)

---

## Global State Management

**Location**: `/app/providers.tsx`

**Context**: `AppContext`

**Global State**:
```typescript
{
  user: User | null                    // Authentication state
  setUser: (user: User | null) => void
  
  liftToDragRatio: number              // Performance metric (shared)
  setLiftToDragRatio: (ratio: number) => void
  
  isSimulating: boolean                // Design page: simulation state
  setIsSimulating: (simulating: boolean) => void
  
  simulationComplete: boolean          // Design page: simulation done
  setSimulationComplete: (complete: boolean) => void
  
  showFlowField: boolean               // Design page: view toggle
  setShowFlowField: (show: boolean) => void
}
```

---

## Shared Layout Components

**Location**: `/components/RootLayout.tsx`

**Rendered in**: `/app/layout.tsx` (wraps all pages)

**Components**:
1. **TopBar** - Navigation between pages
   - Tab switcher (Design | Optimize | Turbine)
   - User menu
   - Authentication state

2. **Global Modals** (accessible from any page):
   - `AuthModal` - Login/signup
   - `SavedDesignsModal` - Saved airfoil designs
   - `ProfileModal` - User profile and settings

---

## Routing

### Navigation Flow

```
/ (root)
  ↓ (auto-redirect)
/design ← → /optimize ← → /turbine
```

### Route Handling

- **Client-side navigation**: `useRouter()` from `next/navigation`
- **Active route detection**: `usePathname()` for tab highlighting
- **Route changes**: `router.push('/design' | '/optimize' | '/turbine')`

### Navigation Triggers

1. TopBar tab clicks
2. Programmatic navigation (e.g., after optimization)
3. Direct URL access

---

## State Persistence Across Routes

### Persisted State (via Context):
- ✅ User authentication
- ✅ Lift-to-drag ratio (shared metric)
- ✅ Simulation state (when returning to Design page)

### Non-Persisted State (page-specific):
- ❌ Fullscreen toggles
- ❌ Modal visibility
- ❌ Optimization progress

---

## Page Isolation

Each page is **completely independent**:

1. **Separate files**: Each page has its own `page.tsx` in a dedicated folder
2. **Independent imports**: Pages only import components they need
3. **Local state**: Page-specific state doesn't leak between routes
4. **Unmounting**: When navigating away, page components unmount

### Benefits:
- Clean separation of concerns
- Easy to maintain and extend
- Code splitting per page
- Optimal bundle sizes

---

## Adding New Pages

To add a new page:

1. Create folder: `/app/new-page/`
2. Create file: `/app/new-page/page.tsx`
3. Add to TopBar navigation in `/components/TopBar.tsx`
4. Add to route detection in `/components/RootLayout.tsx`
5. Create page-specific components in `/components/`

Example:
```typescript
// /app/analysis/page.tsx
'use client';

import { MyAnalysisComponent } from '../../components/MyAnalysisComponent';
import { useAppContext } from '../providers';

export default function AnalysisPage() {
  const { liftToDragRatio } = useAppContext();
  
  return (
    <div>
      <MyAnalysisComponent ratio={liftToDragRatio} />
    </div>
  );
}
```

---

## Key Next.js Conventions Used

1. **App Router**: Modern Next.js routing with `/app` directory
2. **File-based routing**: Each folder in `/app` becomes a route
3. **Client Components**: `'use client'` directive for interactivity
4. **Server Components**: Layout can be server-rendered (future optimization)
5. **Metadata**: SEO-friendly metadata in layout
6. **TypeScript**: Full type safety across the application