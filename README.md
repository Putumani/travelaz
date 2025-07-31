# travelaz (In Development)
A hotel comparison app built with React, Supabase, Cloudinary, and a Flask/Selenium backend.

## Status
Work in progress, currently scraping Booking.com and Trip.com, with plans to add more travel sites (e.g., Priceline.com, Hotels.com).

## Features
- Browse Top 10 hotels in Durban, Cape Town, and Bangkok
- Real-time price scraping (Booking.com, Trip.com)
- Currency conversion and multi-language support

## Setup
1. Clone: `git clone https://github.com/myname/travelaz`
2. Front-end: `cd client && npm install && npm run dev`
3. Back-end: `cd server && pip install flask selenium flask-cors && python app.py`
4. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`
5. View: `http://localhost:5173`

## Live Demo
[Try the prototype](https://myname.github.io/travelaz/)# travelaz (In Development)
A hotel comparison app built with React, Supabase, Cloudinary, and a Flask/Selenium backend.

## Status
Work in progress, currently scraping Booking.com and Trip.com, with plans to add more travel sites (e.g., Expedia, Hotels.com).

## Features
- Browse hotels in Durban, Cape Town, and Bangkok
- Real-time price scraping (Booking.com, Trip.com)
- Currency conversion and multi-language support
- Responsive UI with Tailwind CSS

## Setup
1. Clone: `git clone https://github.com/myname/travelaz`
2. Front-end: `cd client && npm install && npm run dev`
3. Back-end: `cd server && pip install flask selenium flask-cors && python app.py`
4. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`
5. View: `http://localhost:5173`

## Live Demo
[Try the prototype](https://myname.github.io/travelaz/)

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
