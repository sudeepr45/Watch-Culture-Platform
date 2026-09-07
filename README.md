# Watch Culture Platform

The core foundation for the Watch Culture Platform, built with React, Vite, TypeScript, and Tailwind CSS.

## Tech Stack
- **Framework**: [React 19](https://react.dev/)
- **Bundler**: [Vite](https://vite.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Linter**: [ESLint](https://eslint.org/)

## Project Structure
```text
src/
├── assets/          # Static assets (images, icons)
├── components/      # Reusable shared UI components
│   ├── common/      # Generic UI primitives
│   └── layout/      # Layout shells and wrappers
├── features/        # Domain-driven feature modules
├── hooks/           # Shared React hooks
├── lib/             # Third-party configurations & utilities
├── services/        # API and external client services
├── types/           # Shared TypeScript interfaces & types
└── utils/           # Utility functions & helpers
```

## Available Scripts
- `npm run dev`: Start the development server
- `npm run build`: Compile TypeScript and build for production
- `npm run lint`: Run ESLint checks
- `npm run preview`: Preview the production build locally
