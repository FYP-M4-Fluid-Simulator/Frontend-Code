# WebSocket Connection Test Guide

## ✅ Fixes Applied

1. **Session Creation** - Added default RAE2822 airfoil CST parameters matching your Python client
2. **WebSocket Config** - Now properly uses `WS_BACKEND_URL` from environment variables  
3. **Error Handling** - Added comprehensive error logging and reconnection logic
4. **Data Validation** - Added safety checks for frame structure

## 🔧 Configuration

Your `.env.local` is set to:
```
NEXT_PUBLIC_PYTHON_BACKEND_URL=http://127.0.0.1:8001
WS_BASE=ws://127.0.0.1:8001
```

## 🚀 Testing Steps

### 1. Start Backend Server
```bash
uvicorn turbodiff.api.streaming_server:app --reload --port 8001
```

### 2. Restart Frontend (REQUIRED)
Environment variables need a fresh start:
```bash
# Stop current dev server (Ctrl+C)
npm run dev
```

### 3. Open Test Page
Navigate to: `http://localhost:3000/test_page`

### 4. Check Browser Console
You should see this sequence:
```
✅ Session created with ID: <some-uuid>
🔌 Connecting to WebSocket: ws://127.0.0.1:8001/ws/<uuid>
✅ WebSocket connected successfully
📦 First frame structure: { keys: ['fields'], sample: {...} }
```

### 5. Verify Canvas Display
- **Status bar**: Should be GREEN with "✅ Connected"
- **Canvas**: Should show fluid simulation with curl visualization
  - Gray = solid cells (airfoil)
  - Red/Blue = fluid curl (vorticity)

## ❌ Troubleshooting

### "WS_BACKEND_URL is not defined"
- Restart dev server to load `.env.local`

### "❌ WebSocket error" or Red Status Bar
- Verify backend is running: `curl http://127.0.0.1:8001/sessions`
- Check backend logs for connection errors

### "⚠️ Frame data structure" Warning
- Backend is sending unexpected format
- Check console for actual structure
- Frame should have `fields` object with `u`, `v`, `curl`, `solid` arrays

### Black Canvas (no rendering)
- Check console for frame structure warnings
- Verify frame.fields.curl and frame.fields.solid exist
- Grid size should be 256x128 for "medium" fidelity

## 📊 Expected Data Structure

Backend should send:
```json
{
  "fields": {
    "u": [[...], ...],      // 128x256 array
    "v": [[...], ...],      // 128x256 array  
    "curl": [[...], ...],   // 128x256 array
    "solid": [[...], ...]   // 128x256 array (boolean)
  }
}
```

## 🎯 Next Steps

Once working, you can customize session parameters in `createSession.ts`:
- `angle_of_attack`
- `inflow_velocity`  
- `cst_upper` / `cst_lower` (airfoil shape)
- `chord_length`
- etc.
