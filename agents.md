# Agent Guidelines & Project Rules

These rules govern the development workflows, codebase interactions, and design patterns within the Soji's Shawarma project environment.

## 1. Content Style & Modular Design Pattern
- **Strict Modularity:** Code must be broken down into small, reusable, and single-purpose components. Avoid monolithic files or "god functions". 
- **Design Patterns:** Utilize appropriate design patterns (e.g., custom hooks for business logic separation in React, repository or service layers for data fetching).
- **Content Style:** Follow Next.js 15 (App Router) best practices. Maintain a clean, consistent naming convention. Component files should be PascalCase (`MyComponent.tsx`); utilities and hooks should be camelCase (`useAuth.ts`, `apiClient.ts`).
- **CSS / Styling:** Leverage TailwindCSS v4 strictly. Avoid inline styles unless dynamically calculated. Utilize the Next.js `globals.css` / `index.css` for setting up CSS variables and base tokens.

## 2. Completeness & Feature Protocol
- **No Incomplete Features:** Never leave a feature in an incomplete or "broken" state across major commits. 
- **Reporting System:** If a feature cannot be completed due to technical blockers, missing dependencies, or architecture constraints, it **MUST** be immediately documented and reported rather than stubbed poorly. Leave detailed comments or create/update an issue artifact explaining the blocker.

## 3. Communication & Code Safety
- **No Assumptions:** If user intent is ambiguous, request clarification. Do not guess and implement potentially destructive changes.
- **Backend/Frontend Boundaries:** Maintain the strict boundary between the frontend (React Query, Zustand) and the backend (or BaaS like Firebase moving forward). Do not mix server-side secrets with client-side code—strictly use `NEXT_PUBLIC_` prefixes only for safe client variables.
