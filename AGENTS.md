# AGENTS.md - Repository Guidelines for Agentic Coding

## Build & Development Commands

### Essential Commands

- `npm run dev` - Start development server (Vite)
- `npm run build` - Type-check and build for production
- `npm run lint` - Run ESLint on src/ directory
- `npm run type-check` - TypeScript type checking (tsc --noEmit)
- `npm run format` - Format files with Prettier
- `npm run format:check` - Check formatting with Prettier
- `npm run preview` - Preview production build

### Package Manager

Use `npm` (lock file: package-lock.json)

### Testing

No test framework currently configured. Tests should be added using Vitest or Jest when needed.

---

## Code Style Guidelines

### TypeScript Configuration

- Strict mode enabled with noUnusedLocals, noUnusedParameters
- Target: ES2022, Module: ESNext, JSX: react-jsx
- verbatimModuleSyntax: true - use `import type` for type-only imports
- Absolute imports: Use relative paths (`../../../api/`) - NO absolute paths configured

### Formatting (Prettier)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Imports

- Use named imports preferred: `import { useQuery } from '@tanstack/react-query'`
- Type-only imports: `import type { Client } from '../types'`
- Group imports: external deps → internal deps → type imports

### Naming Conventions

- Components: PascalCase (e.g., `ClientsTable`, `ClientFormModal`)
- Files: PascalCase for components (`.tsx`), camelCase for utilities (`.ts`)
- Hooks: `use` prefix (e.g., `useClientsFilters`, `useDebounce`)
- API functions: descriptive names (e.g., `fetchClients`, `createClient`)
- Constants: UPPER_SNAKE_CASE (e.g., `PARTY_TYPES`, `DEFAULT_FILTERS`)
- Types: PascalCase for interfaces/types (e.g., `Client`, `ClientsFilters`)

### Component Structure

- Use function components with explicit Props interface
- Destructure props in function signature
- Use Material UI (MUI v7) components
- Controlled components with React Hook Form + Zod
- Custom hooks in `hooks/` folder

### State Management Strategy

1. **URL State**: Single Source of Truth for filters/pagination/sorting
   - Use `useSearchParams` from react-router-dom
   - Keep URL clean by omitting default values
   - Example: `useClientsFilters()` hook handles URL sync

2. **Server State**: TanStack Query v5 (@tanstack/react-query)
   - Query keys: `['clients', filters]`, `['regions']`
   - Mutations invalidate relevant queries on success
   - Use `staleTime` and `gcTime` for caching strategies

3. **UI State**: Local `useState` for temporary state (modals, debounce)

### API Services (TanStack Query)

- Place API functions in `services/` subfolder
- Export as custom hooks with `use` prefix
- Structure: `fetchX` function → `useX` hook
- Use `apiClient` from `api/axiosClient.ts`
- Mutations: `useCreateX`, `useUpdateX`, `useDeleteX`
- Always invalidate queries after mutations

### Error Handling

- Axios interceptor in `api/axiosClient.ts` transforms errors to BackendErrorResponse
- Error type defined in `types/`: `BackendErrorResponse` with `errorName`, `message`, `errors?`
- Handle backend errors in components with switch/case on `errorName`
- Display field errors via `setError` (React Hook Form) for VALIDATION_ERROR

### Folder Structure

```
src/
├── api/                 # API client configuration
├── features/           # Feature-based modules
│   └── [featureName]/
│       ├── components/ # React components
│       ├── hooks/      # Feature-specific hooks
│       ├── services/   # API services/hooks
│       ├── types/      # TypeScript types
│       └── pages/      # Page components
├── hooks/              # Shared custom hooks
└── main.tsx            # App entry point
```

### Type Definitions

- All types in `types/index.ts` file per feature
- Export constants as const (e.g., `PARTY_TYPES`)
- Use `as const` for enum-like objects
- Type inference with `z.infer<typeof schema>` for form data

### Validation (Zod)

- Define schemas in component files or separate files for reuse
- Use `zodResolver` with React Hook Form
- Custom validations with `.refine()`
- Error messages in Russian (per codebase language)

### Backend Integration

- Base URL: `VITE_API_URL` env var or `http://localhost:8000/api`
- Content-Type: application/json
- Endpoints follow RESTful conventions: `/clients`, `/regions`, `/clients/:id`
- Pagination: `limit`, `offset` query params
- Sort: `sortBy`, `sortOrder` (asc/desc)

### Additional Guidelines

- Language: Russian UI strings, English code/comments
- No tests: Add Vitest/Jest when implementing new features
- Environment: Node.js 18+, use `.env` for configuration
- Dependencies: Use existing libraries (MUI, TanStack Query, React Router DOM, Zod)
- Material UI Theme: Light mode (see main.tsx)
