# RoadWatch — Road Damage Reporting System

A responsive React web app with a mobile-first citizen reporting experience and a desktop administrator dashboard. It supports photo evidence, GPS coordinates, report tracking, status updates, repair-team assignment, and an admin overview.

## 1. Requirements
- Node.js LTS (https://nodejs.org/)
- VS Code (https://code.visualstudio.com/)
- Internet connection for map tiles and Google Fonts

## 2. Run locally
Open this folder in VS Code, then open Terminal > New Terminal:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173). Open the same local network URL on your phone to test the mobile layout; your PC and phone must be on the same Wi-Fi, and Vite must be started with the included `--host 0.0.0.0` setting.

## 3. Demo mode
The app works immediately in demo mode using sample reports and browser memory. Reports submitted in demo mode do not sync between devices and are lost on refresh. This is intentional until Supabase is configured.

## 4. Connect Supabase for shared reports
1. Create a free project at https://supabase.com/dashboard.
2. In Project Settings > API, copy the Project URL and `anon` / publishable key.
3. Duplicate `.env.example` and name the copy `.env`.
4. Put your values in `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

5. In Supabase > SQL Editor, run all of `supabase-setup.sql`.
6. Restart Vite (`Ctrl+C`, then `npm run dev`).

The SQL creates the `reports` table and a public `report-photos` storage bucket. The included policies are intentionally permissive for a classroom prototype. Do not use them as-is for a real public service: add Supabase Auth, admin-only update/delete permissions, citizen privacy controls, spam protection, server-side validation, and secure report tracking first.

## 5. Main routes
- `/` — citizen report submission (mobile-friendly)
- `/track` — track a report using its reference number
- `/admin` — administrator dashboard for review, assignment, and status updates

## 6. Notes and limitations
- GPS requires browser permission and usually a secure context (HTTPS or localhost).
- Photo uploads are stored in Supabase Storage when configured. Demo mode previews the selected image locally only.
- Map/location links open OpenStreetMap. The dashboard includes a location link for reports with GPS coordinates.
- The app uses a single responsive website, not two separately installed applications. Citizens can use it from a phone browser; it can later be enhanced as a PWA.
- The starter uses demo admin access without login. Add real authentication and role checks before deployment.
