# OrbitMSK — Astronaut Musculoskeletal Health & Performance Monitoring

A full-stack local software prototype based on the supplied **Software Development Brief: Astronaut Musculoskeletal Health & Performance Monitoring System**.

OrbitMSK brings astronaut profiles, exercise countermeasure records, individual baseline assessments, sensor measurements, measurable physical performance, rule-based insights, alerts, and historical reports into a single aerospace-inspired dashboard.

> **Important scope and safety note:** This is a fictional-data software prototype, not an official NASA product, a NASA-endorsed system, a medical device, or a diagnostic tool. It does not diagnose muscle atrophy, osteoporosis, bone loss, or any other condition. IMU, force, and pressure sensors do not directly measure muscle mass or bone mineral density. All supplied sample records are fictional and visibly classified as simulated.

## 1. Features

- **Overview dashboard:** astronaut and mission KPIs, adherence trends, force production history, roster, insights, and open alerts.
- **Astronaut management:** create, view, update, and delete profiles; open a detailed astronaut record with related baseline, exercise, performance, sensor, insight, and alert information.
- **Baseline assessments:** record astronaut-specific preflight reference measurements and later assessment records.
- **Exercise countermeasures:** record resistance training, treadmill, cycle ergometer, and functional exercise by equipment category (ARED, Treadmill, CEVIS, ROCKY).
- **Muscle performance:** capture force production, movement velocity, joint ROM, movement consistency, repetition performance, and functional assessment values.
- **Sensor data:** manage IMU, force sensor, and pressure/insoles readings. Includes manual record entry and simulated demo records; no live hardware connection is claimed.
- **Adaptive insights:** deterministic, explainable baseline comparisons and adherence analysis with configurable demonstration thresholds.
- **Alert management:** create, edit, acknowledge/review, resolve, and filter review items.
- **Reports:** generate stored report snapshots; download CSV or print a report snapshot and choose Save as PDF in the browser print dialog.
- **Mission-phase filters:** Preflight, In-flight, and Postflight filters in the shared top bar.
- **Appearance:** switch between dark and light themes from the top bar; the preference is saved in browser local storage.
- **Persistent storage:** Express APIs read and write JSON files. Data persists after backend restarts.

## 2. Technology stack

### Frontend

- React 18 and Vite
- React Router DOM
- Tailwind CSS configuration plus custom responsive CSS
- Recharts
- Lucide React
- Axios
- Framer Motion dependency available for future motion work

### Backend

- Node.js (ES modules)
- Express.js
- JSON file persistence using `node:fs/promises`
- Atomic temporary-file writes followed by rename
- Per-collection write queues to reduce overlapping-write collisions
- Helmet, CORS, and Morgan

### Storage

No database server is used. JSON files live in `backend/data/`. The frontend never accesses those files directly; all reads and writes go through the REST API.

## 3. Project structure

```text
astronaut-msk-monitoring-system/
├── package.json
├── README.md
├── .gitignore
├── .env.example
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── data/
│   │   ├── astronauts.json
│   │   ├── missions.json
│   │   ├── baselineAssessments.json
│   │   ├── exerciseRecords.json
│   │   ├── sensorMeasurements.json
│   │   ├── performanceAssessments.json
│   │   ├── insights.json
│   │   ├── alerts.json
│   │   ├── reports.json
│   │   ├── users.json
│   │   ├── settings.json
│   │   └── auditLogs.json
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── storage/
│   │   └── utils/
│   └── tests/
└── frontend/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        ├── context/
        ├── pages/
        ├── services/
        ├── utils/
        └── styles.css
```

## 4. Requirements

- Node.js 20 or newer recommended (tested with Node 22).
- npm 10 or newer recommended.
- A modern browser.

## 5. Installation

Open a terminal in the extracted project directory.

### Install all packages

```bash
npm run install:all
```

This installs backend and frontend dependencies. The root package uses `concurrently` to run both applications from one terminal; install root development dependencies as part of setup:

```bash
npm install
```

Alternatively, install packages separately:

```bash
npm install --prefix backend
npm install --prefix frontend
```

## 6. Run the application

From the project root:

```bash
npm run dev
```

Open:

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api
- Health check: http://localhost:4000/api/health

The backend initialises the JSON files on its first start. Existing JSON files are not overwritten on later starts.

You can also run each service separately:

```bash
# Terminal 1
npm run dev --prefix backend

# Terminal 2
npm run dev --prefix frontend
```

## 7. Environment configuration

Copy `backend/.env.example` to `backend/.env` and update if required:

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

The frontend defaults to `http://localhost:4000/api`. To change it, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

Never put private keys or credentials in a `VITE_` variable; Vite exposes those values to browser code.

## 8. REST API

All routes are prefixed with `/api` and return a JSON envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": []
}
```

### Health and dashboard

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | API and JSON storage status |
| GET | `/api/dashboard/summary` | Overview KPI aggregation |
| GET | `/api/dashboard/exercise-trends` | Daily exercise completion series |
| GET | `/api/dashboard/performance-trends` | Chronological performance series |

### CRUD resources

The following collections support `GET /api/:resource`, `GET /api/:resource/:id`, `POST /api/:resource`, `PUT /api/:resource/:id`, and `DELETE /api/:resource/:id`:

- `astronauts`
- `missions`
- `baselines`
- `exercises`
- `sensors`
- `performance`
- `insights`
- `alerts`
- `reports`
- `users`
- `settings`

The API also supports query parameters for search, astronaut, mission phase, category, equipment, status, severity, sensor type, data source, date range, sort, page, and page size where relevant.

### Analysis and reports

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/insights/analyse` | Run baseline and adherence analysis for an astronaut |
| POST | `/api/reports/generate` | Save a report snapshot from stored records |
| GET | `/api/reports/:id/export?format=csv` | Download report rows as CSV |
| GET | `/api/reports/:id/export?format=json` | Retrieve report JSON |

Example analysis request:

```json
{
  "astronautId": "AST-001"
}
```

## 9. Data model and provenance

Each record uses a stable `id` and relevant linked identifiers such as `astronautId` and `missionId`. Records normally include `createdAt` and/or `updatedAt` timestamps.

The `dataSource` field distinguishes record origins:

- `simulated`: fictional seeded values for demonstration.
- `manual`: entered through the prototype interface.
- `rule-based`: analysis generated by deterministic software logic.
- `NASA reference`: reserved for separately supplied, verified reference content. No unverified NASA protocol data is seeded in this prototype.

Important JSON files:

- `astronauts.json`: astronaut profile records.
- `missions.json`: mission metadata.
- `baselineAssessments.json`: individual reference measurements.
- `exerciseRecords.json`: prescribed/completed exercise sessions and equipment category.
- `sensorMeasurements.json`: sensor-type, metric, value, unit, and timestamp records.
- `performanceAssessments.json`: measurable physical performance assessments.
- `insights.json`: generated measurement comparisons and explanations.
- `alerts.json`: review items and status.
- `reports.json`: saved report snapshots.
- `settings.json`: prototype settings and configurable analysis conditions.
- `users.json`: demonstration user metadata only.
- `auditLogs.json`: reserved audit record collection.

**Do not treat these local JSON files as a multi-user production database.** They are appropriate for a local prototype and controlled demonstration, not a concurrent production deployment or sensitive operational astronaut data.

## 10. Calculation logic

Exercise adherence:

```text
(completed prescribed sessions / prescribed sessions) × 100
```

Baseline difference:

```text
current measurement − individual baseline measurement
```

Percentage change:

```text
((current − baseline) / |baseline|) × 100
```

When the baseline is zero or unavailable, the percentage is omitted to avoid division-by-zero output. Metric interpretation remains context-dependent; an increase or decrease is not automatically a health improvement or diagnosis.

## 11. AI-assisted insights

The included analysis engine is **rule-based**, not a connected LLM. It:

1. Reads an astronaut's latest baseline and performance record.
2. Compares force production, movement velocity, and joint ROM.
3. Calculates absolute and percentage changes where valid.
4. Checks exercise adherence using stored prescribed/completed records.
5. Creates an insight explanation and, for attention-level conditions, an alert record.

Thresholds are configurable on the Settings page. Default values are illustrative prototype conditions only, not NASA-approved limits or clinically validated thresholds. The architecture can be extended with a server-side LLM provider; no AI API key is required for the current engine.

## 12. Sensor integration limitations

The current prototype supports manual entry and seeded demonstration records. It does not connect directly to IMU, instrumented force, pressure/insole, ARED, treadmill, CEVIS, or ROCKY hardware. A future integration should implement verified device adapters, timestamps, calibration metadata, quality checks, unit normalisation, and provenance before representing incoming values as actual sensor measurements.

## 13. Reports and exports

- Generate a report with filters for astronaut, mission phase, and period.
- CSV export downloads the stored report records.
- Print opens a printable snapshot. Select **Save as PDF** in the browser's print dialog for a PDF file.
- A report records whether records are simulated; check the `dataSource` of each row before interpreting it.

## 14. Testing

Backend unit tests:

```bash
npm test --prefix backend
```

Frontend production build:

```bash
npm run build --prefix frontend
```

Manual integration smoke test:

1. Start the application.
2. Open `http://localhost:5173`.
3. Add a fictional astronaut.
4. Add a baseline assessment for that astronaut.
5. Add one or more exercise records.
6. Add a performance assessment and sensor reading.
7. Select the astronaut in the top bar and open Adaptive Insights.
8. Run analysis and check the generated insight/alert.
9. Generate a report and export CSV.
10. Restart the backend and confirm records remain in `backend/data/`.

## 15. Prototype limitations

- Demo role labels are informational; production-grade authentication and authorisation are not implemented.
- JSON files are for a local prototype; they do not replace a transactional database for production workloads.
- No live sensor or exercise equipment connectivity is provided.
- No external LLM provider is configured; analysis works locally using rule-based logic.
- PDF output uses the browser print workflow, not a server-side PDF rendering engine.
- No HIPAA, NASA, medical-device, or other regulatory certification is claimed.

## 16. Troubleshooting

**Frontend cannot connect to API**

- Confirm backend is running on port 4000.
- Visit http://localhost:4000/api/health.
- Check `CLIENT_ORIGIN` and `VITE_API_URL` if you changed ports.

**Port already in use**

- Change `PORT` in `backend/.env`.
- Change Vite `server.port` in `frontend/vite.config.js` and update `CLIENT_ORIGIN` and `VITE_API_URL` accordingly.

**Data does not appear after startup**

- Confirm `backend/data/` exists and contains valid JSON arrays.
- Check the backend terminal for parse or permission errors.
- Do not manually edit a JSON file while the API is writing to it.

**Want to reset the demo dataset**

- Stop the backend.
- Back up and remove the JSON files in `backend/data/`.
- Start the backend again; missing files are recreated from the fictional seed dataset.

---

**Project name:** OrbitMSK  
**Purpose:** Aerospace-inspired astronaut musculoskeletal performance monitoring prototype  
**Data:** Fictional demonstration records only  
**Affiliation:** Independent prototype; not an official NASA system
