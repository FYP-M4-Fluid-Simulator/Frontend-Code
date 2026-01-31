# Next.js Routing Guide

## Quick Reference

### Available Routes

| URL | File | Purpose |
|-----|------|---------|
| `/` | `/app/page.tsx` | Home (redirects to `/design`) |
| `/design` | `/app/design/page.tsx` | Airfoil design & CFD simulation |
| `/optimize` | `/app/optimize/page.tsx` | Shape optimization |
| `/turbine` | `/app/turbine/page.tsx` | Wind turbine visualization |

## Navigation Methods

### 1. TopBar Navigation (Recommended)
```typescript
// User clicks tab in TopBar
// RootLayout handles routing:
router.push('/design')    // or
router.push('/optimize')  // or
router.push('/turbine')
```

### 2. Programmatic Navigation
```typescript
import { useRouter } from 'next/navigation';

function MyComponent() {
  const router = useRouter();
  
  // Navigate to a page
  router.push('/optimize');
  
  // Navigate back
  router.back();
  
  // Refresh current page
  router.refresh();
}
```

### 3. Direct URL Access
Users can directly visit:
- `http://localhost:3000/design`
- `http://localhost:3000/optimize`
- `http://localhost:3000/turbine`

## Route Detection

### Get Current Route
```typescript
import { usePathname } from 'next/navigation';

function MyComponent() {
  const pathname = usePathname();
  
  if (pathname === '/design') {
    // On design page
  }
  if (pathname?.includes('/optimize')) {
    // On optimize page
  }
}
```

## Page Lifecycle

### When Navigating Between Routes

```
User on /design
    ↓
Clicks "Optimize" tab
    ↓
RootLayout.handleTabChange() called
    ↓
router.push('/optimize') executed
    ↓
Next.js routing:
  - Design page unmounts
  - Optimize page mounts
    ↓
URL changes to /optimize
    ↓
TopBar highlights "Optimize" tab
```

## State Behavior

### Global State (Persists)
```typescript
// In providers.tsx
const [user, setUser] = useState(null);           // ✅ Persists
const [liftToDragRatio, setLiftToDragRatio] = useState(49.3);  // ✅ Persists
```

### Page-Specific State (Resets)
```typescript
// In /app/design/page.tsx
const [isFullscreen, setIsFullscreen] = useState(false);  // ❌ Resets on navigation
const [showMetricsModal, setShowMetricsModal] = useState(false);  // ❌ Resets
```

## Layout Hierarchy

```
RootLayout (app/layout.tsx)
  └── AppProviders
      └── RootLayout Component
          ├── TopBar (shared)
          ├── {children} ← Page renders here
          └── Global Modals (shared)
```

### For /design:
```
RootLayout
  └── DesignLayout (app/design/layout.tsx)
      └── DesignPage (app/design/page.tsx)
```

### For /optimize:
```
RootLayout
  └── OptimizeLayout (app/optimize/layout.tsx)
      └── OptimizePage (app/optimize/page.tsx)
```

### For /turbine:
```
RootLayout
  └── TurbineLayout (app/turbine/layout.tsx)
      └── TurbinePage (app/turbine/page.tsx)
```

## Common Patterns

### Pattern 1: Navigate After Action
```typescript
// In OptimizePage
const handleOptimizationComplete = () => {
  setLiftToDragRatio(87.3);  // Update global state
  // Stay on page to show results
  // Could navigate: router.push('/turbine')
};
```

### Pattern 2: Conditional Rendering in Page
```typescript
// In OptimizePage
return (
  <>
    {!isOptimizing && !optimizationComplete ? (
      <OptimizationInput />
    ) : isOptimizing ? (
      <OptimizationAnimation />
    ) : (
      <OptimizationResults />
    )}
  </>
);
```

### Pattern 3: Route-Specific UI
```typescript
// In RootLayout
const pathname = usePathname();
const selectedTab = pathname?.includes('/optimize') 
  ? 'optimize' 
  : pathname?.includes('/turbine')
  ? 'turbine'
  : 'design';
```

## Metadata Per Route

Each route has its own metadata:

```typescript
// app/design/layout.tsx
export const metadata = {
  title: 'Design | CFD Airfoil Optimizer',
  description: 'Interactive airfoil geometry editing'
};

// app/optimize/layout.tsx
export const metadata = {
  title: 'Optimize | CFD Airfoil Optimizer',
  description: 'Genetic algorithm-based optimization'
};

// app/turbine/layout.tsx
export const metadata = {
  title: 'Turbine | CFD Airfoil Optimizer',
  description: 'Industrial wind turbine visualization'
};
```

## Adding New Routes

### Step-by-Step

1. **Create route folder**
```bash
mkdir app/analysis
```

2. **Create page.tsx**
```typescript
// app/analysis/page.tsx
'use client';

import { useAppContext } from '../providers';

export default function AnalysisPage() {
  const { liftToDragRatio } = useAppContext();
  
  return (
    <div className="flex-1 p-8">
      <h1>Analysis Page</h1>
      <p>L/D Ratio: {liftToDragRatio}</p>
    </div>
  );
}
```

3. **Create layout.tsx**
```typescript
// app/analysis/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analysis | CFD Airfoil Optimizer',
  description: 'Airfoil performance analysis',
};

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

4. **Add to TopBar**
```typescript
// components/TopBar.tsx
// Add new tab button
<button
  onClick={() => onTabChange('analysis')}
  className={...}
>
  Analysis
</button>
```

5. **Update RootLayout**
```typescript
// components/RootLayout.tsx
const getSelectedTab = () => {
  if (pathname?.includes('/optimize')) return 'optimize';
  if (pathname?.includes('/turbine')) return 'turbine';
  if (pathname?.includes('/analysis')) return 'analysis';  // Add this
  return 'design';
};

const handleTabChange = (tab: string) => {
  router.push(`/${tab}`);
};
```

6. **Navigate to /analysis**
```
http://localhost:3000/analysis
```

## Debugging Routes

### Check if on specific route
```typescript
console.log('Current path:', usePathname());
```

### Check route params
```typescript
// For dynamic routes like /design/[id]
import { useParams } from 'next/navigation';

const params = useParams();
console.log('Route params:', params);
```

### Check search params
```typescript
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
console.log('Query param:', searchParams.get('id'));
```

## Best Practices

1. ✅ Use `router.push()` for navigation
2. ✅ Use `usePathname()` for route detection
3. ✅ Keep page state local to pages
4. ✅ Use global state only for shared data
5. ✅ Add metadata to each layout
6. ✅ Use 'use client' only where needed
7. ✅ Keep route logic in RootLayout
8. ✅ Don't nest routers

## Common Issues

### Issue: Route doesn't update
❌ **Wrong:**
```typescript
<a href="/optimize">Go</a>  // Full page reload
```

✅ **Correct:**
```typescript
const router = useRouter();
router.push('/optimize');  // Client-side navigation
```

### Issue: State persists when it shouldn't
❌ **Problem:** Using global state for UI state

✅ **Solution:** Use local useState in pages
```typescript
// In page, not in providers
const [isFullscreen, setIsFullscreen] = useState(false);
```

### Issue: Can't detect active route
❌ **Wrong:**
```typescript
const [selectedTab, setSelectedTab] = useState('design');  // Out of sync
```

✅ **Correct:**
```typescript
const pathname = usePathname();
const selectedTab = pathname?.includes('/optimize') ? 'optimize' : 'design';
```

---

## Summary

Your app uses **Next.js App Router** with:
- ✅ File-based routing
- ✅ Proper page separation
- ✅ Client-side navigation
- ✅ Route-specific metadata
- ✅ Clean state management

Routes are **real pages**, not components!
