# Frontend Structure

This document describes the organization of the frontend codebase.

## Overview

The frontend follows a **feature-based architecture** where code is organized by domain/feature rather than by technical layer. This approach improves maintainability and scalability.

## Directory Structure

```
src/
├── common/                      # Common code shared across features
│   ├── components/             # Reusable UI components
│   │   └── ui/                # Base UI components (Button, Input, etc.)
│   ├── lib/                   # Utilities and helpers
│   │   ├── api-client.ts      # Axios instance & interceptors
│   │   └── storage.ts         # Token storage utilities
│   ├── types/                 # Common types (User, AuthResponse)
│   │   └── index.ts
│   └── config/                # App configuration
│       └── index.ts           # API URLs, constants
│
├── features/                   # Feature modules
│   ├── auth/                  # Authentication feature
│   │   ├── components/        # Auth-specific components
│   │   ├── hooks/            # Auth-specific hooks
│   │   ├── pages/            # Auth pages (Login, Register)
│   │   ├── services/         # Auth API service
│   │   │   └── auth.service.ts
│   │   ├── types/            # Auth types
│   │   ├── AuthContext.tsx
│   │   └── AuthProvider.tsx
│   │
│   └── captures/             # Captures/Notes feature
│       ├── components/       # Capture-specific components
│       ├── hooks/           # Capture-specific hooks
│       ├── pages/           # Capture pages
│       ├── services/        # Captures API service
│       │   └── captures.service.ts
│       ├── types/           # Capture types (Capture, GraphData)
│       └── utils/           # Capture-specific utilities
│
├── App.tsx                   # Root application component
├── index.tsx                 # Application entry point
└── index.scss               # Global styles
```

## Key Principles

### 1. Feature-Based Organization

Each feature (auth, captures) is self-contained with its own:
- **Components**: Feature-specific UI components
- **Hooks**: Custom hooks for the feature's logic
- **Pages**: Top-level page components
- **Services**: API communication layer
- **Types**: TypeScript type definitions
- **Utils**: Feature-specific utility functions

### 2. Separation of Concerns

- **Services**: Handle all API communication
- **Hooks**: Encapsulate business logic and state management
- **Components**: Focus on presentation and user interaction
- **Types**: Centralized type definitions

### 3. Modular Services

API logic is split into focused service modules:
- `common/lib/api-client.ts`: Configured axios instance
- `features/auth/services/auth.service.ts`: Authentication endpoints
- `features/captures/services/captures.service.ts`: Capture/note endpoints

### 4. Type Organization

Types are organized by scope:
- **Common types** (`common/types/`): Shared across features (User, AuthResponse)
- **Feature types** (`features/*/types/`): Feature-specific (Capture, GraphData)

## Benefits

1. **Better Maintainability**: Related code is grouped together
2. **Improved Discoverability**: Easy to find code by feature
3. **Scalability**: Easy to add new features following the same pattern
4. **Testability**: Each feature can be tested independently
5. **Clear Dependencies**: Import paths show feature boundaries

## Import Conventions

The project uses **path aliases** for cleaner imports. All imports use the `@/` prefix to reference the `src/` directory:

```typescript
// ✅ Use path aliases (preferred)
import { Button } from '@/common/components/ui/Button';
import { apiClient } from '@/common/lib/api-client';
import { User } from '@/common/types';
import { authService } from '@/features/auth/services/auth.service';
import { Capture } from '@/features/captures/types';

// ❌ Avoid relative paths
import { Button } from '../../../../common/components/ui/Button';
import { authService } from '../services/auth.service';
```

### Path Alias Configuration

Path aliases are configured in [`tsconfig.json`](tsconfig.json):

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Common Path Aliases

- **Common modules**: `@/common/*`
  - `@/common/components/ui/*` - UI components
  - `@/common/lib/*` - Utilities (api-client, storage)
  - `@/common/types` - Shared types
  - `@/common/config` - Configuration

- **Feature modules**: `@/features/*`
  - `@/features/auth/*` - Authentication feature
  - `@/features/captures/*` - Captures/notes feature

### Benefits

1. **No relative path confusion**: No more `../../../..` chains
2. **Refactor-friendly**: Moving files doesn't break imports
3. **Clear intent**: Immediately see if importing from common or a feature
4. **IDE support**: Better autocomplete and navigation
5. **Consistent**: Same pattern throughout the codebase

## Adding a New Feature

To add a new feature, follow this structure:

```
features/
└── new-feature/
    ├── components/
    ├── hooks/
    ├── pages/
    ├── services/
    │   └── new-feature.service.ts
    ├── types/
    │   └── index.ts
    └── utils/
```

Each feature should be as self-contained as possible, only importing from `common/` or other features when necessary.
