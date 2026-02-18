<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1teVT_ZFK1C8wxuN6s31RvogWGaa4hNfw

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set environment variables in `.env.local`:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run the app:
   `npm run dev`

## Supabase Data Model

The app now supports Supabase as the data repository for:
- `users`
- `lineas_negocio`
- `disciplinas`
- `proyectos`
- `tareas`
- `actividades`
- `alertas`

Create the schema from:
- `supabase/schema.sql`

If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing, the app falls back to local storage.

## Import Fixture For Production

This repo includes CSV seeds under `data/` and a generated one-sheet import file:
- `public/datos_prueba_importacion.xlsx`

To regenerate the file after updating CSV seeds:
- `node scripts/generate-production-import-file.mjs`
