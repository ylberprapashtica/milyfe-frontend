# Captures Feature

This directory contains all code related to the capture functionality - a feature for capturing and managing thoughts.

## Structure

```
captures/
├── components/       # Reusable UI components
├── pages/           # Page-level components (routes)
├── hooks/           # Custom React hooks for business logic
├── types.ts         # TypeScript type definitions
└── README.md        # This file
```

## Components

### CaptureInput
Input component for creating new captures. Handles input state and Enter key submission.

**Props:**
- `onSubmit: (thought: string) => Promise<void>` - Callback when capture is submitted
- `disabled?: boolean` - Whether input should be disabled
- `placeholder?: string` - Placeholder text

### CaptureForm
Form wrapper component that displays error messages and contains the capture input.

**Props:**
- `children: ReactNode` - Form content (typically CaptureInput)
- `error?: string | null` - Error message to display

### CaptureItem
Component for displaying and editing a single capture. Supports inline editing with Enter to save and Escape to cancel.

**Props:**
- `capture: Capture` - The capture data to display
- `onUpdate: (id: number, thought: string) => Promise<void>` - Callback when capture is updated
- `onDelete: (id: number) => Promise<void>` - Callback when capture is deleted
- `disabled?: boolean` - Whether component should be disabled

### CaptureList
Component for displaying a list of captures. Handles empty and loading states.

**Props:**
- `captures: Capture[]` - Array of captures to display
- `onUpdate: (id: number, thought: string) => Promise<void>` - Callback when a capture is updated
- `onDelete: (id: number) => Promise<void>` - Callback when a capture is deleted
- `disabled?: boolean` - Whether the list should be disabled
- `loading?: boolean` - Whether the list is currently loading

## Pages

### CapturesPage
Main page component for viewing and creating captures. Orchestrates the capture list and creation functionality.

**Route:** `/`

### CaptureDetailPage
Detail page component for viewing and editing a single capture. Fetches the capture by ID from URL parameters.

**Route:** `/captures/:id`

## Hooks

### useCaptures
Custom hook for managing the list of captures. Handles fetching all captures, creating new captures, and managing loading/error states.

**Returns:**
- `captures: Capture[]` - Array of all captures
- `loading: boolean` - Whether a request is in progress
- `error: string | null` - Error message if request failed
- `reload: () => Promise<void>` - Function to reload all captures
- `createCapture: (thought: string) => Promise<void>` - Function to create a new capture

### useCapture
Custom hook for managing individual capture operations. Handles updating and deleting a single capture.

**Returns:**
- `loading: boolean` - Whether a request is in progress
- `error: string | null` - Error message if request failed
- `updateCapture: (id: number, thought: string) => Promise<void>` - Function to update a capture
- `deleteCapture: (id: number) => Promise<void>` - Function to delete a capture

## Types

### Capture
```typescript
interface Capture {
  id: number;
  thought: string;
  created_at: string;
  updated_at: string;
}
```

## Usage Example

```tsx
import { CapturesPage } from './captures/pages/CapturesPage';
import { CaptureDetailPage } from './captures/pages/CaptureDetailPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CapturesPage />} />
        <Route path="/captures/:id" element={<CaptureDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## API Integration

All API calls are made through the `capturesApi` service located in `src/services/api.ts`. The hooks use this service internally, so components don't need to import it directly.

## Styling

Each component has its own SCSS file for styling. The styles use a consistent color scheme defined in each file:
- Chinese Violet: `#805A8A`
- Deep Koamaru: `#2D2F66`
- Pastel Blue: `#7cb2cb`
- White: `#FFFFFF`

