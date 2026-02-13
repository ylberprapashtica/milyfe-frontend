import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
} from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { capturesService } from '@/features/captures/services/captures.service';
import { projectsService } from '@/features/projects/services/projects.service';
import type { CaptureStatus, CaptureType } from '@/features/captures/types';
import type { Project } from '@/features/projects/types';

export interface ReferenceDataState {
  captureTypes: CaptureType[] | null;
  captureStatuses: CaptureStatus[] | null;
  tags: string[];
  projects: Project[] | null;
  loadingTypes: boolean;
  loadingStatuses: boolean;
  loadingTags: boolean;
  loadingProjects: boolean;
  errorTypes: string | null;
  errorStatuses: string | null;
  errorTags: string | null;
  errorProjects: string | null;
}

const initialState: ReferenceDataState = {
  captureTypes: null,
  captureStatuses: null,
  tags: [],
  projects: null,
  loadingTypes: false,
  loadingStatuses: false,
  loadingTags: false,
  loadingProjects: false,
  errorTypes: null,
  errorStatuses: null,
  errorTags: null,
  errorProjects: null,
};

type ReferenceDataContextValue = ReferenceDataState & {
  reload: () => Promise<void>;
  reloadProjects: () => void;
  ensureTypesLoaded: () => void;
  ensureStatusesLoaded: () => void;
  ensureTagsLoaded: () => void;
  ensureProjectsLoaded: () => void;
};

const ReferenceDataContext = createContext<ReferenceDataContextValue | null>(null);

export interface ReferenceDataProviderProps {
  children: ReactNode;
}

/**
 * Provider that caches capture types, statuses, tags, and projects.
 * Fetches each resource once on first use and shares the result across all consumers.
 */
export const ReferenceDataProvider = ({ children }: ReferenceDataProviderProps): ReactElement => {
  const [state, setState] = useState<ReferenceDataState>(initialState);
  const fetchedTypes = useRef(false);
  const fetchedStatuses = useRef(false);
  const fetchedTags = useRef(false);
  const fetchedProjects = useRef(false);

  const loadTypes = useCallback(async (): Promise<void> => {
    if (fetchedTypes.current) return;
    fetchedTypes.current = true;
    setState((s) => ({ ...s, loadingTypes: true, errorTypes: null }));
    try {
      const data = await capturesService.getCaptureTypes();
      setState((s) => ({ ...s, captureTypes: data, loadingTypes: false, errorTypes: null }));
    } catch (err) {
      console.error('Error loading capture types:', err);
      setState((s) => ({
        ...s,
        loadingTypes: false,
        errorTypes: 'Failed to load types',
      }));
      fetchedTypes.current = false;
    }
  }, []);

  const loadStatuses = useCallback(async (): Promise<void> => {
    if (fetchedStatuses.current) return;
    fetchedStatuses.current = true;
    setState((s) => ({ ...s, loadingStatuses: true, errorStatuses: null }));
    try {
      const data = await capturesService.getCaptureStatuses();
      setState((s) => ({ ...s, captureStatuses: data, loadingStatuses: false, errorStatuses: null }));
    } catch (err) {
      console.error('Error loading capture statuses:', err);
      setState((s) => ({
        ...s,
        loadingStatuses: false,
        errorStatuses: 'Failed to load statuses',
      }));
      fetchedStatuses.current = false;
    }
  }, []);

  const loadTags = useCallback(async (): Promise<void> => {
    if (fetchedTags.current) return;
    fetchedTags.current = true;
    setState((s) => ({ ...s, loadingTags: true, errorTags: null }));
    try {
      const data = await capturesService.getTags();
      setState((s) => ({
        ...s,
        tags: data.map((t) => t.name),
        loadingTags: false,
        errorTags: null,
      }));
    } catch (err) {
      console.error('Error loading tags:', err);
      setState((s) => ({
        ...s,
        loadingTags: false,
        errorTags: 'Failed to load tags',
      }));
      fetchedTags.current = false;
    }
  }, []);

  const loadProjects = useCallback(async (): Promise<void> => {
    if (fetchedProjects.current) return;
    fetchedProjects.current = true;
    setState((s) => ({ ...s, loadingProjects: true, errorProjects: null }));
    try {
      const data = await projectsService.getProjects();
      setState((s) => ({ ...s, projects: data, loadingProjects: false, errorProjects: null }));
    } catch (err) {
      console.error('Error loading projects:', err);
      setState((s) => ({
        ...s,
        loadingProjects: false,
        errorProjects: 'Failed to load projects',
      }));
      fetchedProjects.current = false;
    }
  }, []);

  const reload = useCallback(async (): Promise<void> => {
    fetchedTypes.current = false;
    fetchedStatuses.current = false;
    fetchedTags.current = false;
    fetchedProjects.current = false;
    setState(initialState);
    await Promise.all([loadTypes(), loadStatuses(), loadTags(), loadProjects()]);
  }, [loadTypes, loadStatuses, loadTags, loadProjects]);

  const reloadProjects = useCallback((): void => {
    fetchedProjects.current = false;
    loadProjects();
  }, [loadProjects]);

  const value: ReferenceDataContextValue = {
    ...state,
    reload,
    reloadProjects,
    ensureTypesLoaded: () => { loadTypes(); },
    ensureStatusesLoaded: () => { loadStatuses(); },
    ensureTagsLoaded: () => { loadTags(); },
    ensureProjectsLoaded: () => { loadProjects(); },
  };

  return (
    <ReferenceDataContext.Provider value={value}>
      {children}
    </ReferenceDataContext.Provider>
  );
};

/**
 * When rendered inside AuthProvider and ReferenceDataProvider, preloads
 * types, statuses, tags, and projects once the user is authenticated.
 */
export const ReferenceDataPreload = (): null => {
  const { isAuthenticated } = useAuth();
  const ctx = useContext(ReferenceDataContext);
  useEffect(() => {
    if (isAuthenticated && ctx) {
      ctx.ensureTypesLoaded();
      ctx.ensureStatusesLoaded();
      ctx.ensureTagsLoaded();
      ctx.ensureProjectsLoaded();
    }
  }, [isAuthenticated, ctx]);
  return null;
};

function useReferenceDataContext(): ReferenceDataContextValue {
  const ctx = useContext(ReferenceDataContext);
  if (ctx === null) {
    throw new Error('useReferenceData hooks must be used within ReferenceDataProvider');
  }
  return ctx;
}

/**
 * Hook that returns capture types from shared cache. Triggers fetch on first use.
 */
export function useCaptureTypes(): {
  captureTypes: CaptureType[];
  loading: boolean;
  error: string | null;
} {
  const ctx = useReferenceDataContext();
  useEffect(() => {
    ctx.ensureTypesLoaded();
  }, [ctx]);
  return {
    captureTypes: ctx.captureTypes ?? [],
    loading: ctx.loadingTypes,
    error: ctx.errorTypes,
  };
}

/**
 * Hook that returns capture statuses from shared cache. Triggers fetch on first use.
 */
export function useCaptureStatuses(): {
  captureStatuses: CaptureStatus[];
  loading: boolean;
  error: string | null;
} {
  const ctx = useReferenceDataContext();
  useEffect(() => {
    ctx.ensureStatusesLoaded();
  }, [ctx]);
  return {
    captureStatuses: ctx.captureStatuses ?? [],
    loading: ctx.loadingStatuses,
    error: ctx.errorStatuses,
  };
}

/**
 * Hook that returns tag names from shared cache. Triggers fetch on first use.
 */
export function useTags(): {
  tags: string[];
  loading: boolean;
  error: string | null;
} {
  const ctx = useReferenceDataContext();
  useEffect(() => {
    ctx.ensureTagsLoaded();
  }, [ctx]);
  return {
    tags: ctx.tags,
    loading: ctx.loadingTags,
    error: ctx.errorTags,
  };
}

/**
 * Hook that returns projects from shared cache. Triggers fetch on first use.
 */
export function useProjects(): {
  projects: Project[];
  loading: boolean;
  error: string | null;
  reloadProjects: () => void;
} {
  const ctx = useReferenceDataContext();
  useEffect(() => {
    ctx.ensureProjectsLoaded();
  }, [ctx]);
  return {
    projects: ctx.projects ?? [],
    loading: ctx.loadingProjects,
    error: ctx.errorProjects,
    reloadProjects: ctx.reloadProjects,
  };
}