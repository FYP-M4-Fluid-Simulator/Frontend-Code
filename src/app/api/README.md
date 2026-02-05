# CFD Airfoil Platform - API Documentation

This directory contains Next.js API routes for the CFD Airfoil Analysis Platform. These are currently **dummy endpoints** that return simulated data. In production, these will connect to your backend CFD solver, database, and optimization engine.

## API Endpoints

### 1. CST Coefficient Update
**Endpoint:** `POST /api/cst/update`

Updates a single CST (Class Shape Transformation) coefficient and recalculates airfoil geometry.

**Request Body:**
```json
{
  "surface": "upper" | "lower",
  "index": 0,
  "value": 0.15
}
```

**Response:**
```json
{
  "success": true,
  "message": "CST coefficient updated successfully",
  "data": {
    "surface": "upper",
    "index": 0,
    "value": 0.15,
    "timestamp": "2026-02-05T..."
  }
}
```

**Future Backend Integration:**
- Validate coefficient ranges (-0.5 to 0.5)
- Recalculate Bernstein polynomial basis
- Update geometry in database
- Return new airfoil coordinates

---

### 2. CFD Simulation Runner
**Endpoint:** `POST /api/simulate/run`

Runs a computational fluid dynamics simulation with the specified airfoil and flow parameters.

**Request Body:**
```json
{
  "upperCoefficients": [0.15, 0.20, 0.18, 0.12, 0.08],
  "lowerCoefficients": [-0.10, -0.12, -0.09, -0.06, -0.04],
  "velocity": 15,
  "angleOfAttack": 5,
  "meshDensity": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "message": "CFD simulation completed successfully",
  "data": {
    "liftCoefficient": 0.8542,
    "dragCoefficient": 0.0234,
    "momentCoefficient": -0.0891,
    "maxPressure": 1.45,
    "minPressure": 0.62,
    "ldRatio": "36.5",
    "computationTime": 2.1,
    "meshElements": 25000,
    "iterations": 1500,
    "convergenceAchieved": true
  }
}
```

**Future Backend Integration:**
- Generate Eulerian mesh
- Solve Navier-Stokes equations
- Calculate aerodynamic coefficients
- Generate pressure/velocity contours
- Support WebSocket/SSE for real-time progress

---

### 3. Genetic Algorithm Optimization
**Endpoint:** `POST /api/optimize/start`

Initiates genetic algorithm optimization to find optimal CST coefficients.

**Request Body:**
```json
{
  "upperCoefficients": [0.15, 0.20, 0.18, 0.12, 0.08],
  "lowerCoefficients": [-0.10, -0.12, -0.09, -0.06, -0.04],
  "velocity": 15,
  "angleOfAttack": 5,
  "targetLiftDrag": 70,
  "populationSize": 30,
  "mutationRate": 0.1,
  "maxIterations": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Genetic optimization completed successfully",
  "data": {
    "optimizedUpperCoefficients": [0.16, 0.21, ...],
    "optimizedLowerCoefficients": [-0.11, -0.13, ...],
    "bestLiftCoefficient": 1.245,
    "bestDragCoefficient": 0.0187,
    "bestLDRatio": 66.6,
    "generationsCompleted": 50,
    "convergenceIteration": 40,
    "totalSimulations": 1500,
    "computationTime": 10.0,
    "improvementPercentage": 24.5
  }
}
```

**Future Backend Integration:**
- Initialize population with CST variations
- Run CFD for each individual (fitness evaluation)
- Perform selection (tournament/roulette)
- Apply crossover and mutation operators
- Stream progress via Server-Sent Events
- Return best individual after convergence

---

## Development Notes

### Current State
All endpoints return **simulated data** with realistic values. This allows frontend development and testing without a backend.

### Backend Integration Checklist

When connecting to your real backend:

1. **CST Update API** (`/api/cst/update`):
   - [ ] Connect to Bernstein polynomial calculator
   - [ ] Validate coefficient ranges
   - [ ] Update database/cache
   - [ ] Return real geometry coordinates

2. **Simulation API** (`/api/simulate/run`):
   - [ ] Queue simulation jobs (e.g., Bull, Celery)
   - [ ] Connect to CFD solver (OpenFOAM, SU2, custom)
   - [ ] Generate mesh based on density parameter
   - [ ] Solve flow equations
   - [ ] Calculate C_L, C_D, C_M
   - [ ] Return pressure/velocity field data
   - [ ] Implement progress updates (SSE/WebSocket)

3. **Optimization API** (`/api/optimize/start`):
   - [ ] Initialize GA with user parameters
   - [ ] Run CFD simulations for fitness evaluation
   - [ ] Implement selection strategy
   - [ ] Implement crossover operator
   - [ ] Implement mutation operator
   - [ ] Stream intermediate results
   - [ ] Store optimization history

### Technology Suggestions

**CFD Solvers:**
- OpenFOAM (open-source)
- SU2 (open-source, Python-friendly)
- Custom Python solver (NumPy/SciPy)

**Queue Systems:**
- Bull (Node.js)
- Celery (Python)
- BullMQ (Next.js compatible)

**Real-time Updates:**
- Server-Sent Events (SSE)
- WebSocket (Socket.io)
- Next.js API streaming

**Database:**
- PostgreSQL (simulation results)
- Redis (caching, session state)
- MongoDB (flexible schema for varied results)

---

## Testing APIs

You can test the dummy APIs using curl:

```bash
# CST Update
curl -X POST http://localhost:3000/api/cst/update \
  -H "Content-Type: application/json" \
  -d '{"surface":"upper","index":0,"value":0.18}'

# Run Simulation
curl -X POST http://localhost:3000/api/simulate/run \
  -H "Content-Type: application/json" \
  -d '{"upperCoefficients":[0.15,0.20,0.18],"lowerCoefficients":[-0.10,-0.12,-0.09],"velocity":15,"angleOfAttack":5,"meshDensity":"medium"}'

# Start Optimization
curl -X POST http://localhost:3000/api/optimize/start \
  -H "Content-Type: application/json" \
  -d '{"upperCoefficients":[0.15,0.20],"lowerCoefficients":[-0.10,-0.12],"targetLiftDrag":70,"populationSize":30,"mutationRate":0.1,"maxIterations":50}'
```

---

## Next Steps

1. Set up your backend CFD solver
2. Create a job queue for long-running simulations
3. Replace dummy responses with real calculations
4. Add authentication/authorization
5. Implement rate limiting
6. Add request validation with Zod or similar
7. Set up database for storing results
8. Implement SSE/WebSocket for real-time updates
