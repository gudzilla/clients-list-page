# AGENTS.md

Guidelines for AI agents working in this React + TypeScript + Vite codebase.

## Project Overview

Clients management application using React 19, Material UI, and React Query.
Backend API at `http://localhost:8000/api`.

## Build Commands

```bash
npm run dev         # Start Vite dev server
npm run build       # Type check and build for production
npm run preview     # Preview production build locally
```

## Lint Commands

```bash
npm run lint        # ESLint on all files
npm run format      # Prettier format src/**/*.{ts,tsx,js,jsx,json,css,md}
npm run format:check # Check formatting without modifying
```

**Note:** No test runner configured. Add Vitest if tests needed.

## Code Style

### Formatting (Prettier)
- Single quotes, semicolons required
- Trailing commas (ES5 compatible)
- 2-space indentation, no tabs
- 80 character print width

### TypeScript
- Strict mode enabled, target ES2022
- No unused locals/parameters allowed
- Use `type` imports: `import type { Client } from '../types'`
- Interface naming: PascalCase (e.g., `CreateClientDto`)
- Type naming: PascalCase with descriptive names

### Naming Conventions
- Components: PascalCase (e.g., `ClientFormModal`)
- Hooks: camelCase starting with "use" (e.g., `useClients`)
- API functions: camelCase (e.g., `fetchClients`, `createClient`)
- Files: PascalCase for components, camelCase for utilities

### Imports Order
1. External libraries (React, MUI, etc.)
2. Internal absolute imports (from 'src/...')
3. Relative imports (from '../...')
4. Type imports last within group

### Project Structure

```
src/
├── features/clients/     # Feature-based organization
│   ├── components/       # React components (PascalCase files)
│   ├── pages/           # Page-level components
│   ├── services/        # API hooks and functions
│   └── types/           # TypeScript definitions
├── api/                 # Axios client configuration
├── App.tsx              # Root component
└── main.tsx             # Entry point with providers
```

## Error Handling

Backend returns structured errors:
```typescript
interface BackendErrorResponse {
  errorName: 'VALIDATION_ERROR' | 'CLIENT_NOT_FOUND' | ...;
  message: string;
  errors?: ValidationErrorDetail[];
}
```

- Catch errors in components using `try/catch`
- Check for `errorName` property to identify error type
- Display validation errors using MUI form helpers
- Display generic errors using MUI Alert/Snackbar
- Use russian error messages for user-facing text

## Key Patterns

### React Query Hooks
```typescript
// Separate API function from hook
async function fetchClients(filters: ClientsFilters) {
  const response = await apiClient.get<ClientsResponse>('/clients', { params: filters });
  return response.data;
}

// Export hook with cache configuration
export function useClients(filters: ClientsFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => fetchClients(filters),
    placeholderData: keepPreviousData,
  });
}
```

### Forms with Validation
- Use `react-hook-form` with `zodResolver`
- Define Zod schema with russian error messages
- Use MUI TextField with Controller for controlled inputs
- Handle backend validation errors in `onError` callback

### Environment Variables
- Use `import.meta.env.VITE_API_URL` for API base URL
- Defined in `.env` file at project root

## Technology Stack

- **Build:** Vite 7 with React plugin
- **UI:** Material UI v7 with Emotion styling
- **Data:** TanStack Query v5 (React Query)
- **Forms:** React Hook Form v7 + Zod v4
- **HTTP:** Axios with interceptors
- **Lint:** ESLint 9 + typescript-eslint + Prettier
