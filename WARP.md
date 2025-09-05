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
