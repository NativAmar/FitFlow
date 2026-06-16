# FitFlow Frontend

React frontend for the FitFlow fitness management application. Connects to the FitFlow backend API for authentication, trainee data, and user settings.

## Prerequisites

The backend must be running before testing the frontend. Start the FitFlow API server first, then start this app.

## API Base URL

**http://localhost:3000**

All frontend API requests are sent to this backend URL (configured in `src/services/api.js`).

## Install

```bash
npm install
```

## Start

```bash
npm start
```

Opens the app at [http://localhost:3001](http://localhost:3001).

## Build

```bash
npm run build
```

Creates an optimized production build in the `build/` folder.

## Ports

| Service      | URL                        |
| ------------ | -------------------------- |
| Backend API  | http://localhost:3000      |
| Frontend app | http://localhost:3001      |

## Demo Login

- Email: `trainer@fitflow.com`
- Password: `123456`

## Routes

| Path         | Description                    |
| ------------ | ------------------------------ |
| `/login`     | Login page                     |
| `/dashboard` | Dashboard with trainee data    |
| `/settings`  | User settings form             |

## Features

- Login with client-side validation
- Protected routes (redirect to login when not authenticated)
- Navbar and footer layout on protected pages
- Dashboard with summary stats, insight cards, and data table
- Reusable insight card component
- Dynamic trainees table with backend data
- Settings form connected to backend API
- Loading, error, and success states

## Folder Structure

```
src/
  components/   Reusable UI components (Card, Table, Navbar, Footer, Layout)
  pages/        Page components (Login, Dashboard, Settings)
  services/     API service layer
  App.js        Root component with routing
```
