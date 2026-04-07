# SPA Project: University Task Board (Frontend)

## Overview
This is the frontend application for the University Task Board, built as a modern, responsive Single Page Application (SPA). It provides interfaces for three roles: **Students**, **Employees** (Staff), and **Administrators**.

## Tech Stack
- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **Styling**: Tailwind CSS (plus custom glassmorphism and premium design tokens in `index.css`).
- **Icons**: Lucide React.
- **Animations**: Framer Motion.
- **API Client**: Axios (configured with interceptors for auth).
- **State Management**: React Context API (`AuthContext`).
- **Routing**: React Router DOM v6.

## Directory Structure
- `/src/api`: Axios client configuration and service definitions.
- `/src/components`:
  - `/ui`: Atomic reusable components (Button, Card, Input) with `cn` utility logic.
  - Custom complex components (e.g., `SubmissionModal`).
- `/src/context`: Global state providers (`AuthContext.tsx`).
- `/src/layouts`: Component wrappers for routing (e.g., `MainLayout.tsx` with sidebar).
- `/src/pages`: Main view components representing entire routes.
- `/src/types`: TypeScript interfaces and enums reflecting backend models.
- `/src/index.css`: Global styles, variable definitions (HSL colors), and Tailwind layers.

## Design Patterns
1. **Premium Aesthetic**: We use HSL-based color palettes (Surface, Primary) and glassmorphism (backdrop-blur, translucent borders) for a high-end look.
2. **Component Composition**: UI components in `src/components/ui` are designed to be composable. Always check `Button.tsx` for usage of variants and `cn`.
3. **Role-Based UI**: Many components (like `MyTasks.tsx`) use `useAuth()` to conditionally render content based on the user's role (`student` vs `employee`).
4. **Motion**: Use `framer-motion` for page transitions and interactive elements (hover scales, list animations).

## Core Data Models (`src/types/index.ts`)
- `User`: Handles `role` (Admin, Employee, Student), `points`, and `reputation`.
- `Task`: Contains lifecycle `status` (pending_approval, open, in_progress, review, completed).
- `Category`: Categorization for tasks.

## Key Files for Agents
- `src/api/client.ts`: Where the global Axios instance is configured.
- `src/App.tsx`: Central route mapping.
- `src/layouts/MainLayout.tsx`: The primary shell with sidebar/navigation logic.
- `src/pages/DashboardHub.tsx`: Route dispatcher that loads the correct dashboard based on role.

## Advice for Future Agents
- **Consistency**: When adding new UI, use the existing design tokens in `index.css` (e.g., `bg-surface-50`, `text-primary-600`).
- **Imports**: We use `@/` alias for `src/`. Ensure TypeScript module resolution is working.
- **Role Awareness**: Always check the current user's role before implementing actions. Employees manage tasks; Students apply for them.
- **Animations**: Prefer `AnimatePresence` for exit animations and `motion.div` for entry/layout transitions.
