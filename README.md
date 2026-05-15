# TurboDiff Frontend (Local Deployment )

A frontend client for the TurboDiff backend. This UI provides controls to create
simulation/optimization sessions and stream results from the API.

Repository link: https://github.com/FYP-M4-Fluid-Simulator/TurboDiff

# Requirements

- Node.js (LTS recommended)
- npm (comes with Node.js)

# Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

# Configuration

Set these environment variables in your frontend environment configuration
(e.g., `.env` or `.env.local`):

```
NEXT_PUBLIC_PYTHON_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_BASE=ws://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

# Notes

- Ensure the backend is running before starting the frontend.
- If authentication is enabled, make sure your frontend includes a valid
  `Authorization: Bearer <token>` header on API requests.
- Database connectivity is handled by the backend.

# API Endpoints

Use the following frontend API routes:

```
/api/airfoil_deck
/api/optimize/start
/api/optimize/iteration
/api/simulate/run
```
