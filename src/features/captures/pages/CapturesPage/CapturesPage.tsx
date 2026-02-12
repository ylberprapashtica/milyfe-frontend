import { useState, useEffect, useRef, useCallback, ReactElement, ChangeEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCaptures } from '@/features/captures/hooks/useCaptures';
import { useCapture } from '@/features/captures/hooks/useCapture';
import { capturesService } from '@/features/captures/services/captures.service';
import { Capture } from '@/features/captures/types';
import { CaptureList } from '@/features/captures/components/CaptureList';
import { GraphView, GraphFilters } from '@/features/captures/components/GraphView';
import { CaptureEditModal } from '@/features/captures/components/CaptureEditModal';
import { Button } from '@/common/components/ui/Button';
import './CapturesPage.scss';

/**
 * Main page component for viewing captures in slipbox view
 * 
 * This page orchestrates the capture list and graph view functionality.
 * It uses the useCaptures hook for list operations and useCapture hook
 * for individual capture operations. The page displays a list or graph
 * view of existing captures with search functionality.
 * 
 * @returns {ReactElement} The rendered slipbox page
 * 
 * @example
 * ```tsx
 * // Used in routing
 * <Route path="/slipbox" element={<CapturesPage />} />
 * ```
 */
export const CapturesPage = (): ReactElement => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { captures, loading, reload } = useCaptures();
  const { loading: updateLoading, updateCapture, deleteCapture } = useCapture();
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [filteredCaptures, setFilteredCaptures] = useState<Capture[]>(captures);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [projectView, setProjectView] = useState<boolean>(true);
  
  // Initialize sidebar state based on screen size (collapsed by default on mobile)
  const getInitialSidebarState = (): boolean => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  };
  
  const SIDEBAR_WIDTH_KEY = 'captures-sidebar-width';
  const SIDEBAR_WIDTH_MIN = 280;
  const SIDEBAR_WIDTH_MAX = 600;
  const getInitialSidebarWidth = (): number => {
    if (typeof window === 'undefined') return 350;
    const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (stored) {
      const n = parseInt(stored, 10);
      if (!Number.isNaN(n) && n >= SIDEBAR_WIDTH_MIN && n <= SIDEBAR_WIDTH_MAX) return n;
    }
    return 350;
  };

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(getInitialSidebarState());
  const [sidebarWidth, setSidebarWidth] = useState<number>(getInitialSidebarWidth);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editCaptureId, setEditCaptureId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [highlightedCaptureId, setHighlightedCaptureId] = useState<number | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResizingRef = useRef<boolean>(false);

  // Clear highlight timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // Handle responsive sidebar state
  useEffect(() => {
    const handleResize = (): void => {
      // Auto-collapse on mobile, auto-expand on desktop
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Load search query from URL params
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Filter captures based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCaptures(captures);
      return;
    }

    const performSearch = async (): Promise<void> => {
      try {
        const results = await capturesService.searchCaptures(searchQuery);
        setFilteredCaptures(results);
      } catch (err) {
        console.error('Error searching captures:', err);
        // Fallback to client-side filtering
        const filtered = captures.filter(
          (capture) =>
            capture.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            capture.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            capture.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredCaptures(filtered);
      }
    };

    performSearch();
  }, [searchQuery, captures]);

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Update URL params
    if (query.trim()) {
      setSearchParams({ search: query });
    } else {
      setSearchParams({});
    }
  };

  /**
   * Handle capture update
   */
  const handleUpdate = async (
    id: number,
    content: string,
    title?: string,
    tags?: string[],
    capture_type_id?: number | null
  ): Promise<void> => {
    await updateCapture(id, content, title, tags, capture_type_id);
    await reload();
  };

  /**
   * Handle capture delete
   */
  const handleDelete = async (id: number): Promise<void> => {
    await deleteCapture(id);
    await reload();
  };

  /**
   * Handle navigation to create note page
   */
  const handleCreateCapture = (): void => {
    navigate('/');
  };

  /**
   * Handle clearing all filters
   */
  const handleClearFilters = (): void => {
    setStatusFilter([]);
    setTypeFilter([]);
    setProjectFilter([]);
  };

  const lastSidebarWidthRef = useRef<number>(sidebarWidth);
  lastSidebarWidthRef.current = sidebarWidth;

  /**
   * Resize sidebar by dragging (desktop only); persist width to localStorage on mouseup
   */
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (window.innerWidth <= 768) return;
    isResizingRef.current = true;
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const x = moveEvent.clientX;
      const next = Math.max(SIDEBAR_WIDTH_MIN, Math.min(SIDEBAR_WIDTH_MAX, x));
      setSidebarWidth(next);
    };
    const onMouseUp = () => {
      isResizingRef.current = false;
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(lastSidebarWidthRef.current));
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  /**
   * Delete a link between captures (from sidebar); refreshes list and graph
   */
  const handleDeleteLink = async (linkId: number): Promise<void> => {
    await capturesService.deleteLink(linkId);
    await reload();
    setRefreshTrigger((t) => t + 1);
  };

  /**
   * Open edit modal for a capture (e.g. from sidebar Open)
   */
  const handleOpenCapture = (id: number): void => {
    setEditCaptureId(id);
    setShowEditModal(true);
  };

  /**
   * Close edit modal
   */
  const handleCloseEditModal = (): void => {
    setEditCaptureId(null);
    setShowEditModal(false);
  };

  /**
   * After successful update in modal: refresh list and graph
   */
  const handleEditUpdateSuccess = (): void => {
    reload();
    setRefreshTrigger((t) => t + 1);
  };

  /**
   * When a graph node (body) is clicked: scroll to that capture in the sidebar and show highlight.
   * In responsive (mobile) mode we do not auto-open the sidebar.
   */
  const handleNodeClick = (captureId: number): void => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
    setHighlightedCaptureId(captureId);
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      setSidebarOpen(true);
    }
    requestAnimationFrame(() => {
      document.getElementById(`capture-item-${captureId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedCaptureId(null);
      highlightTimeoutRef.current = null;
    }, 2500);
  };

  const isLoading = loading || updateLoading;

  return (
    <div className="captures-page">
      <div className="captures-page-header">
        <div className="captures-page-header-content">
          <button
            className="captures-page-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          
          <div className="captures-page-search">
            <input
              type="text"
              className="captures-page-search-input"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <GraphFilters
            selectedStatuses={statusFilter}
            selectedTypes={typeFilter}
            selectedProjects={projectFilter}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
            onProjectChange={setProjectFilter}
            onClearFilters={handleClearFilters}
          />
          <Button
            onClick={handleCreateCapture}
            variant="primary"
            size="medium"
            className="captures-page-create-button"
            aria-label="Create Capture"
          >
            <span className="captures-page-create-button-text">Create Capture</span>
            <span className="captures-page-create-button-icon">+</span>
          </Button>
        </div>
      </div>

      <div className="captures-page-layout">
        <aside
          className={`captures-page-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
          style={{ width: sidebarOpen ? sidebarWidth : undefined }}
        >
          <CaptureList
            captures={filteredCaptures}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onOpenCapture={handleOpenCapture}
            onDeleteLink={handleDeleteLink}
            highlightedCaptureId={highlightedCaptureId}
            disabled={isLoading}
            loading={loading && filteredCaptures.length === 0}
          />
        </aside>
        {sidebarOpen && (
          <div
            className="captures-page-sidebar-resize"
            style={{ left: sidebarWidth - 3 }}
            onMouseDown={handleResizeStart}
            role="separator"
            aria-label="Resize sidebar"
          />
        )}
        <div className="captures-page-graph">
          <GraphView
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            projectFilter={projectFilter}
            projectView={projectView}
            onProjectViewChange={setProjectView}
            onTitleClick={handleOpenCapture}
            onNodeClick={handleNodeClick}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
      <CaptureEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        captureId={editCaptureId}
        onUpdateSuccess={handleEditUpdateSuccess}
      />
    </div>
  );
};

