import { useState, useEffect, ReactElement, ChangeEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCaptures } from '@/features/captures/hooks/useCaptures';
import { useCapture } from '@/features/captures/hooks/useCapture';
import { capturesService } from '@/features/captures/services/captures.service';
import { Capture } from '@/features/captures/types';
import { CaptureList } from '@/features/captures/components/CaptureList';
import { GraphView } from '@/features/captures/components/GraphView';
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
  
  // Initialize sidebar state based on screen size (collapsed by default on mobile)
  const getInitialSidebarState = (): boolean => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  };
  
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(getInitialSidebarState());

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
    tags?: string[]
  ): Promise<void> => {
    await updateCapture(id, content, title, tags);
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
        <aside className={`captures-page-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <CaptureList
            captures={filteredCaptures}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            disabled={isLoading}
            loading={loading && filteredCaptures.length === 0}
          />
        </aside>
        
        <div className="captures-page-graph">
          <GraphView />
        </div>
      </div>
    </div>
  );
};

