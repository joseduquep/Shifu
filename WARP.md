# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Shifu is a Next.js web application for rating university professors at EAFIT. It centralizes student reviews and professor information to help students make informed decisions when choosing classes and instructors.

## Development Commands

### Core Development
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Package Manager Support
The project supports multiple package managers as documented in README.md:
- `npm run dev` / `yarn dev` / `pnpm dev` / `bun dev`

## Architecture Overview

### Next.js App Router Structure
- **App Router**: Uses Next.js 15 with the modern `app/` directory structure
- **React 19**: Latest React with concurrent features
- **TypeScript**: Strict TypeScript configuration with path aliases (`@/*`)
- **Styling**: Tailwind CSS v4 with custom design system

### Key Application Structure
- `app/layout.tsx`: Root layout with custom fonts (Geist Sans/Mono) and global Navbar
- `app/page.tsx`: Landing page with hero section, feature cards, and call-to-action flows
- `app/components/`: Shared components including complex Navbar with mega menus
- `app/login/` & `app/register/`: Authentication flows with form validation

### Design System
- **Dark theme**: Primary colors use `#0b0d12` background with `#b9d9ff` accent
- **Typography**: Geist font family with careful spacing and hierarchy  
- **Interactive elements**: Hover states, transitions, and form validation feedback
- **Component patterns**: Consistent rounded corners, border styling, and spacing

### Authentication Context
- **Student-focused**: Registration requires EPIK ID (university identifier)
- **Form validation**: Complex password requirements with real-time feedback
- **TODO markers**: Auth integration points are marked for backend implementation

### Navigation Architecture
The Navbar component implements a sophisticated mega menu system with:
- Hover-triggered panels for main sections (Explorar, Profesores, Calificar, Ranking, Acerca)
- Timed close behavior with mouse event handling
- Comprehensive link structure revealing the planned application scope

### Current State
- **Frontend-only**: No backend API integration yet (auth flows contain TODO comments)
- **Production-ready UI**: Comprehensive component library and design system
- **Scalable structure**: App Router setup ready for additional routes and features

## Development Notes

### Route Planning
Based on navigation links, the application will include:
- `/profesores` - Professor search and profiles
- `/ranking` - Professor rankings with various scopes
- `/calificar` - Rating submission flows
- `/explorar` - Discovery and browsing features
- Authentication flows already implemented

### Form Handling Patterns
Registration form demonstrates comprehensive validation patterns that should be followed for other forms:
- Real-time validation feedback
- Password strength requirements
- Accessible form controls with proper labeling

## Assistant and Coding Rules
This repository adheres to the “NextJS Rules” and related conventions described in <rule:u7sPdw7zeRSTaCsRyGOHWb> (Name: NextJS Rules, Type: AI Rule). Future Warp instances must follow these rules when proposing or applying changes. Project-specific conventions in this WARP.md take precedence in case of conflict.

Key points to observe from the rule:
- Planning and implementation: plan step-by-step, write brief pseudocode for complex changes, and consider edge cases.
- Code style: tabs for indentation, single quotes, omit semicolons unless required, strict equality (===), trailing commas in multiline literals, kebab-case filenames, PascalCase components and interfaces, camelCase variables/functions/hooks.
- React/Next.js: functional components, prefer Server Components by default; use 'use client' only when needed (event handlers, browser APIs, stateful UI); use Next.js components (Image, Link) and proper loading states and error boundaries.
- Performance: prefer useCallback/useMemo appropriately; avoid using array index as key; use dynamic imports for code splitting as needed.
- TypeScript: strict mode, clear interfaces for props/state, use guards and utility types (Partial, Pick, Omit), prefer interface over type when extending.
- Styling: TailwindCSS utility-first approach; maintain dark theme variables and consistent spacing; ensure accessible color contrast.
- Testing: prefer Jest + React Testing Library patterns; mock external calls.

Reference: see inline rule content ID u7sPdw7zeRSTaCsRyGOHWb for the full list of practices to follow.
