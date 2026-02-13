import { useEffect, useState, useCallback, useRef, ReactElement, createContext, useContext } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Connection,
  addEdge,
  MarkerType,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { capturesService } from '@/features/captures/services/captures.service';
import { projectsService } from '@/features/projects/services/projects.service';
import { GraphData } from '@/features/captures/types';
import { CaptureNode, CaptureNodeData } from './CaptureNode';
import { ProjectNode } from './ProjectNode';
import FloatingEdge from './FloatingEdge';
import CustomConnectionLine from './CustomConnectionLine';
import { ConfirmModal } from '@/common/components/ui';
import { CaptureCreateModal } from '@/features/captures/components/CaptureCreateModal';
import './GraphView.scss';

/**
 * Context for passing onTitleClick callback to CaptureNode (opens modal)
 */
const NodeTitleClickContext = createContext<((captureId: number) => void) | undefined>(undefined);

/**
 * Context for passing onNodeClick callback (scroll to sidebar + highlight)
 */
const NodeClickContext = createContext<((captureId: number) => void) | undefined>(undefined);

/**
 * Props for the GraphView component
 */
export interface GraphViewProps {
  /** Optional filter by tags */
  tagFilter?: string[];
  /** Optional filter by status names (inclusive - only show nodes with these statuses) */
  statusFilter?: string[];
  /** Optional filter by type names (inclusive - only show nodes with these types) */
  typeFilter?: string[];
  /** Optional callback when node title is clicked (e.g. open edit modal) */
  onTitleClick?: (captureId: number) => void;
  /** Optional callback when node body is clicked (e.g. scroll to capture in sidebar) */
  onNodeClick?: (captureId: number) => void;
  /** When this value changes, graph data is refetched (e.g. after modal update) */
  refreshTrigger?: number;
  /** Whether to show project view (group nodes by project) */
  projectView?: boolean;
  /** Callback when project view toggle changes */
  onProjectViewChange?: (enabled: boolean) => void;
  /** Optional filter by project IDs (string IDs; use "none" for unassigned) */
  projectFilter?: string[];
}

/**
 * Edge data type for storing link metadata
 */
interface EdgeData extends Record<string, unknown> {
  linkId?: number;
  filtered?: boolean;
}

/**
 * Wrapper component for CaptureNode that uses context for onTitleClick and onNodeClick
 */
const CaptureNodeWithContext = (props: { id: string; data: CaptureNodeData }) => {
  const onTitleClick = useContext(NodeTitleClickContext);
  const onNodeClick = useContext(NodeClickContext);
  return <CaptureNode {...props} onTitleClick={onTitleClick} onNodeClick={onNodeClick} />;
};

const nodeTypes = {
  note: CaptureNodeWithContext,
  project: ProjectNode,
} as const;

const edgeTypes = {
  floating: FloatingEdge as any,
};

const defaultEdgeOptions = {
  type: 'floating' as const,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#ffffff',
    width: 10,
    height: 10,
  },
  style: {
    stroke: '#ffffff',
    strokeWidth: 2,
  },
};

const connectionLineStyle = {
  stroke: '#ffffff',
  strokeWidth: 2,
} as const;

const PROJECT_LAYOUTS_KEY = 'milyfe_project_layouts';
const NODE_WIDTH = 220;
const NODE_HEIGHT = 180;
const GRID_PADDING = 24;
const GRID_COLS = 3;
const GRID_GAP = 40;

type ProjectLayout = { x: number; y: number; width: number; height: number };

/** Fallback: read project layouts from localStorage (backward compatibility when API has no project_layouts). */
function getProjectLayouts(): Record<string, ProjectLayout> {
  try {
    const stored = localStorage.getItem(PROJECT_LAYOUTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Graph view component for visualizing note connections
 * 
 * Displays an interactive graph of notes and their links using React Flow.
 * Users can click on nodes to navigate to note details.
 * 
 * @param {GraphViewProps} props - Component props
 * @returns {ReactElement} The rendered graph view component
 * 
 * @example
 * ```tsx
 * <GraphView tagFilter={['tag1', 'tag2']} />
 * ```
 */
/** Data type for all graph nodes (capture notes or project containers) */
type GraphNodeData = (CaptureNodeData | { label: string; projectId: number | string }) & Record<string, unknown>;

type GraphNode = Node<GraphNodeData>;

export const GraphView = ({
  tagFilter,
  statusFilter,
  typeFilter,
  onTitleClick,
  onNodeClick,
  refreshTrigger,
  projectView = false,
  onProjectViewChange,
  projectFilter,
}: GraphViewProps): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<EdgeData>>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [edgeToDelete, setEdgeToDelete] = useState<Edge<EdgeData> | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createPosition, setCreatePosition] = useState<{ x: number; y: number } | null>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance<GraphNode, Edge<EdgeData>> | null>(null);
  const pendingLayoutsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const layoutFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LAYOUT_DEBOUNCE_MS = 500;

  /**
   * Handle clicking on an edge to request deletion
   */
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge<EdgeData>) => {
    setEdgeToDelete(edge);
    setShowDeleteModal(true);
  }, []);

  /**
   * Handle confirmed deletion of edge
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!edgeToDelete) return;

    const linkId = edgeToDelete.data?.linkId;

    if (!linkId) {
      console.error('Link ID not found in edge data');
      return;
    }

    try {
      // Call API to delete link
      await capturesService.deleteLink(linkId);

      // Remove edge from graph
      setEdges((eds) => eds.filter((e) => e.id !== edgeToDelete.id));
    } catch (err) {
      console.error('Error deleting link:', err);
      setError('Failed to delete connection. Please try again.');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  }, [edgeToDelete, setEdges]);

  /**
   * Handle delete modal close
   */
  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setEdgeToDelete(null);
  }, []);

  /**
   * Store React Flow instance on init (for screenToFlowPosition)
   */
  const onInit = useCallback((instance: ReactFlowInstance<GraphNode, Edge<EdgeData>>) => {
    reactFlowInstanceRef.current = instance;
  }, []);

  /**
   * Handle double-click on pane - open create capture modal at that position
   */
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (event.detail !== 2) return;
    const instance = reactFlowInstanceRef.current;
    if (!instance?.screenToFlowPosition) return;
    const position = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setCreatePosition({ x: position.x, y: position.y });
    setShowCreateModal(true);
  }, []);

  /**
   * Handle create modal close
   */
  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setCreatePosition(null);
  }, []);

  /**
   * Handle node drag stop to save position (flat or project view)
   */
  const onNodeDragStop = useCallback(async (_event: React.MouseEvent, node: GraphNode) => {
    if (node.type === 'project') return;
    const captureId = node.data && 'captureId' in node.data ? node.data.captureId : undefined;
    if (typeof captureId !== 'number' || !node.position) return;

    try {
      if (projectView && node.parentId) {
        await capturesService.updateCaptureProjectPosition(
          captureId,
          node.position.x,
          node.position.y
        );
      } else {
        await capturesService.updateCapturePosition(
          captureId,
          node.position.x,
          node.position.y
        );
      }
    } catch (err) {
      console.error('Error saving node position:', err);
    }
  }, [projectView]);

  /**
   * Handle nodes change: accumulate project layout updates and flush in one API call (debounced).
   */
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      for (const ch of changes) {
        if (!('id' in ch) || !ch.id) continue;
        const node = nodes.find((n) => n.id === ch.id);
        if (node?.type !== 'project' || !node.data) continue;

        const projId = (node.data as { projectId?: string }).projectId;
        if (!projId || projId === 'none') continue;

        let layout: ProjectLayout | null = null;
        if (ch.type === 'dimensions' && ch.dimensions) {
          layout = {
            x: node.position.x,
            y: node.position.y,
            width: ch.dimensions.width ?? (node.style?.width as number) ?? 300,
            height: ch.dimensions.height ?? (node.style?.height as number) ?? 200,
          };
        } else if (ch.type === 'position' && ch.position) {
          const w = (node.style?.width as number) ?? 300;
          const h = (node.style?.height as number) ?? 200;
          layout = { x: ch.position.x, y: ch.position.y, width: w, height: h };
        }
        if (layout) {
          const idStr = String(projId);
          if (!Number.isNaN(Number(projId))) {
            pendingLayoutsRef.current[idStr] = layout;
            if (layoutFlushTimeoutRef.current === null) {
              layoutFlushTimeoutRef.current = setTimeout(() => {
                const toSend = { ...pendingLayoutsRef.current };
                pendingLayoutsRef.current = {};
                layoutFlushTimeoutRef.current = null;
                if (Object.keys(toSend).length > 0) {
                  projectsService.updateProjectLayouts(toSend).catch((err) => {
                    console.error('Error saving project layouts:', err);
                  });
                }
              }, LAYOUT_DEBOUNCE_MS);
            }
          }
        }
      }
    },
    [onNodesChange, nodes]
  );

  /**
   * Handle creating a new connection between nodes
   */
  const onConnect = useCallback(async (connection: Connection) => {
    // Extract capture IDs from node data
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) {
      console.error('Source or target node not found');
      return;
    }

    const sourceCaptureId = sourceNode.data && 'captureId' in sourceNode.data ? sourceNode.data.captureId : undefined;
    const targetCaptureId = targetNode.data && 'captureId' in targetNode.data ? targetNode.data.captureId : undefined;

    if (typeof sourceCaptureId !== 'number' || typeof targetCaptureId !== 'number') {
      console.error('Source or target capture ID not found');
      return;
    }

    try {
      // Call API to create link
      const result = await capturesService.createLink(sourceCaptureId, targetCaptureId);
      
      // Create the edge with the linkId from backend
      const newEdge: Edge<EdgeData> = {
        id: `link-${result.link.id}`,
        source: connection.source,
        target: connection.target,
        type: 'floating',
        animated: true,
        data: {
          linkId: result.link.id,
        },
      };

      // Add edge to the graph
      setEdges((eds) => addEdge(newEdge, eds));

      // Update the source node with the updated capture data
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === connection.source) {
            return {
              ...node,
              data: {
                ...node.data,
                content: result.source_capture.content,
                updated_at: result.source_capture.updated_at,
              },
            };
          }
          return node;
        })
      );
    } catch (err) {
      console.error('Error creating link:', err);
      setError('Failed to create connection. Please try again.');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  }, [nodes, setEdges, setNodes]);

  /**
   * Load graph data from API
   */
  const loadGraphData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const graphData: GraphData = await capturesService.getGraphData();
      
      // Convert API data to React Flow format
      const flowNodes: GraphNode[] = graphData.nodes.map((node) => ({
        id: node.id,
        type: 'note' as const,
        position: node.position,
        data: node.data as CaptureNodeData,
        dragHandle: '.drag-handle__custom',
        connectable: true,
      }));

      // Create a Set of all valid node IDs for edge validation
      const validNodeIds = new Set(flowNodes.map((node) => node.id));

      // Convert edges and validate they reference existing nodes
      const flowEdges: Edge<EdgeData>[] = graphData.edges
        .filter((edge) => {
          // Validate edge has valid source and target (not null/undefined)
          return (
            edge.source &&
            edge.target &&
            typeof edge.source === 'string' &&
            typeof edge.target === 'string' &&
            validNodeIds.has(edge.source) &&
            validNodeIds.has(edge.target)
          );
        })
        .map((edge) => ({
          id: edge.linkId ? `link-${edge.linkId}` : edge.id,
          source: edge.source,
          target: edge.target,
          type: 'floating' as const,
          animated: true,
          data: {
            linkId: edge.linkId,
          },
        }));

      // Apply filters (tag, status, type)
      // For status and type filters, we keep all nodes but mark filtered ones
      // For tag filter, we remove nodes (existing behavior)
      let filteredNodes: GraphNode[] = flowNodes;
      let filteredEdges: Edge<EdgeData>[] = flowEdges;

      // Apply tag filter if provided (removes nodes)
      if (tagFilter && tagFilter.length > 0) {
        const nodeIdsWithTags = new Set(
          flowNodes
            .filter((node) => {
              const tags = node.data?.tags;
              return Array.isArray(tags) && tags.some((tag: string) => tagFilter.includes(tag));
            })
            .map((node) => node.id)
        );

        filteredNodes = flowNodes.filter((node) => nodeIdsWithTags.has(node.id));
        // Filter edges to only include those where both source and target exist in filtered nodes
        filteredEdges = flowEdges.filter(
          (edge) =>
            nodeIdsWithTags.has(edge.source) && nodeIdsWithTags.has(edge.target)
        );
      }

      // Apply status and type filters (mark nodes as filtered, keep all nodes)
      const hasStatusFilter = statusFilter && statusFilter.length > 0;
      const hasTypeFilter = typeFilter && typeFilter.length > 0;

      if (hasStatusFilter || hasTypeFilter) {
        filteredNodes = filteredNodes.map((node) => {
          const nodeStatus = String(node.data?.status ?? '');
          const nodeType = String(node.data?.type ?? '');
          
          // Check if node matches filters
          const matchesStatus = !hasStatusFilter || (nodeStatus && statusFilter!.includes(nodeStatus));
          const matchesType = !hasTypeFilter || (nodeType && typeFilter!.includes(nodeType));
          
          // Node is filtered if it doesn't match the filters
          const isFiltered = !(matchesStatus && matchesType);
          
          return {
            ...node,
            draggable: !isFiltered, // Disable dragging for filtered nodes
            data: {
              ...node.data,
              filtered: isFiltered,
            },
          };
        });

        // Mark edges as filtered if either source or target node is filtered
        const filteredNodeIds = new Set(
          filteredNodes.filter((node) => node.data?.filtered).map((node) => node.id)
        );

        filteredEdges = filteredEdges.map((edge) => {
          const isFiltered = filteredNodeIds.has(edge.source) || filteredNodeIds.has(edge.target);
          return {
            ...edge,
            data: {
              ...edge.data,
              filtered: isFiltered,
            },
            style: isFiltered
              ? {
                  ...defaultEdgeOptions.style,
                  ...edge.style,
                  opacity: 0.1,
                  stroke: '#ffffff',
                }
              : {
                  ...defaultEdgeOptions.style,
                  ...edge.style,
                },
          };
        });
      }

      // Apply project filter (mark nodes as filtered, keep all nodes)
      const hasProjectFilter = projectFilter && projectFilter.length > 0;
      if (hasProjectFilter) {
        filteredNodes = filteredNodes.map((node) => {
          const pid = (node.data as { project_id?: number | null })?.project_id ?? null;
          const projectKeyStr = pid === null ? 'none' : String(pid);
          const matchesProject = projectFilter!.includes(projectKeyStr);
          const isFilteredByProject = !matchesProject;
          const wasFiltered = (node.data as { filtered?: boolean })?.filtered ?? false;
          const isFiltered = wasFiltered || isFilteredByProject;
          return {
            ...node,
            draggable: node.draggable !== false && !isFiltered,
            data: { ...node.data, filtered: isFiltered },
          };
        });
        const filteredNodeIds = new Set(
          filteredNodes.filter((node) => node.data?.filtered).map((node) => node.id)
        );
        filteredEdges = filteredEdges.map((edge) => {
          const isFiltered = filteredNodeIds.has(edge.source) || filteredNodeIds.has(edge.target);
          return {
            ...edge,
            data: { ...edge.data, filtered: isFiltered },
            style: isFiltered
              ? { ...defaultEdgeOptions.style, ...edge.style, opacity: 0.1, stroke: '#ffffff' }
              : { ...defaultEdgeOptions.style, ...edge.style },
          };
        });
      }

      // Transform to project view if enabled
      let finalNodes = filteredNodes;
      let finalEdges = filteredEdges;

      if (projectView) {
        // Prefer project_layouts from API; fallback to localStorage for backward compatibility
        const projectLayouts: Record<string, ProjectLayout | { x: number | null; y: number | null; width: number | null; height: number | null }> = {
          ...getProjectLayouts(),
          ...(graphData.project_layouts ?? {}),
        };
        const projectKey = (id: number | null) => (id === null ? 'none' : String(id));

        // Group nodes by project_id
        const byProject = new Map<string, GraphNode[]>();
        for (const node of filteredNodes) {
          const pid = (node.data as { project_id?: number | null })?.project_id ?? null;
          const key = projectKey(pid);
          if (!byProject.has(key)) byProject.set(key, []);
          byProject.get(key)!.push(node);
        }

        // Nodes without a project stay free-flowing (top-level, no container)
        const noProjectNodes: GraphNode[] = (byProject.get('none') ?? []).map((n) => ({
          ...n,
          type: 'note' as const,
          parentId: undefined,
          extent: undefined,
          position: n.position,
          data: n.data,
        }));

        const projectNodes: GraphNode[] = [];
        const childNodes: GraphNode[] = [];

        // First pass: collect projects with saved layouts to find the topmost Y (only when y is a number)
        let minYAmongSaved = Infinity;
        const projectEntries = Array.from(byProject.entries()).filter(([k]) => k !== 'none');
        for (const [projKey] of projectEntries) {
          const saved = projectLayouts[projKey];
          if (saved != null && typeof (saved as ProjectLayout).y === 'number') {
            minYAmongSaved = Math.min(minYAmongSaved, (saved as ProjectLayout).y);
          }
        }
        if (minYAmongSaved === Infinity) minYAmongSaved = 0;

        let col = 0;
        let row = 0;
        let newProjectCol = 0;
        let newProjectRow = 0;
        let maxY = 0;

        // Only create project containers for actual projects (skip 'none')
        for (const [projKey, childList] of byProject.entries()) {
          if (projKey === 'none') continue;

          const projectName = (childList[0]?.data as { project?: { name: string } })?.project?.name ?? `Project ${projKey}`;

          // Compute bounds from children
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxYChild = -Infinity;
          for (const n of childList) {
            const pos = n.position;
            minX = Math.min(minX, pos.x);
            minY = Math.min(minY, pos.y);
            maxX = Math.max(maxX, pos.x + NODE_WIDTH);
            maxYChild = Math.max(maxYChild, pos.y + NODE_HEIGHT);
          }
          if (minX === Infinity) minX = 0;
          if (minY === Infinity) minY = 0;
          if (maxX === -Infinity) maxX = NODE_WIDTH;
          if (maxYChild === -Infinity) maxYChild = NODE_HEIGHT;

          const saved = projectLayouts[projKey];
          const width = saved?.width ?? Math.max(maxX - minX + GRID_PADDING * 2, 250);
          const height = saved?.height ?? Math.max(maxYChild - minY + GRID_PADDING * 2, 250);

          const projNodeId = `project-${projKey}`;
          // New projects (no saved layout, or layout has no position) go at the top, above the highest existing project
          const hasSavedPosition = saved != null && typeof (saved as ProjectLayout).x === 'number' && typeof (saved as ProjectLayout).y === 'number';
          const isNewProject = !hasSavedPosition;
          const projectX = saved?.x ?? (isNewProject ? newProjectCol * (width + GRID_GAP) : col * (width + GRID_GAP));
          const projectY = saved?.y ?? (isNewProject ? minYAmongSaved - (newProjectRow + 1) * (height + GRID_GAP) : row * (height + GRID_GAP));

          projectNodes.push({
            id: projNodeId,
            type: 'project',
            position: { x: projectX, y: projectY },
            data: { label: projectName, projectId: projKey },
            style: { width, height },
            draggable: true,
          });

          for (const n of childList) {
            const data = n.data as CaptureNodeData & { project_x?: number | null; project_y?: number | null };
            const relX = data.project_x != null ? data.project_x : n.position.x - minX + GRID_PADDING;
            const relY = data.project_y != null ? data.project_y : n.position.y - minY + GRID_PADDING;

            childNodes.push({
              ...n,
              id: n.id,
              type: 'note',
              parentId: projNodeId,
              extent: 'parent' as const,
              position: { x: relX, y: relY },
              data: n.data,
            });
          }

          if (isNewProject) {
            newProjectCol++;
            if (newProjectCol >= GRID_COLS) {
              newProjectCol = 0;
              newProjectRow++;
            }
          } else {
            col++;
            if (col >= GRID_COLS) {
              col = 0;
              row++;
            }
          }
          maxY = Math.max(maxY, projectY + height);
        }

        finalNodes = [...projectNodes, ...childNodes, ...noProjectNodes];
        // Edges stay the same (connect by node id)
      }

      setNodes(finalNodes);
      setEdges(finalEdges);
    } catch (err) {
      setError('Failed to load graph data. Please try again.');
      console.error('Error loading graph data:', err);
    } finally {
      setLoading(false);
    }
  }, [tagFilter, statusFilter, typeFilter, projectFilter, projectView, setNodes, setEdges]);

  /**
   * Handle successful capture creation - reload graph to show new node
   */
  const handleCreateSuccess = useCallback(() => {
    loadGraphData();
  }, [loadGraphData]);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData, refreshTrigger]);

  useEffect(() => {
    return () => {
      if (layoutFlushTimeoutRef.current !== null) {
        clearTimeout(layoutFlushTimeoutRef.current);
        layoutFlushTimeoutRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="graph-view">
        <div className="graph-view-loading">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="graph-view">
        <div className="graph-view-error" role="alert">
          {error}
        </div>
        <button className="graph-view-retry" onClick={loadGraphData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <NodeTitleClickContext.Provider value={onTitleClick}>
      <NodeClickContext.Provider value={onNodeClick}>
      <div className="graph-view">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={projectView ? handleNodesChange : onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onInit={onInit}
          onPaneClick={onPaneClick}
          zoomOnDoubleClick={false}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineComponent={CustomConnectionLine}
          connectionLineStyle={connectionLineStyle}
          connectionMode={ConnectionMode.Loose}
          connectOnClick={false}
          nodesConnectable={true}
          elementsSelectable={true}
          minZoom={0.05}
          maxZoom={4}
          fitView
        >
          <Background />
          <Panel position="bottom-left">
            {onProjectViewChange && (
              <button
                type="button"
                className={`graph-view-panel__project-btn ${projectView ? 'graph-view-panel__project-btn--active' : ''}`}
                onClick={() => onProjectViewChange(!projectView)}
                aria-pressed={projectView}
                aria-label={projectView ? 'Disable project view' : 'Enable project view'}
                title={projectView ? 'Project view on' : 'Project view off'}
              >
                {projectView ? '📂' : '📁'}
              </button>
            )}
            <Controls />
          </Panel>
          <MiniMap />
        </ReactFlow>
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title="Delete Connection"
          message="Are you sure you want to delete this connection?"
          confirmText="Delete"
          cancelText="Cancel"
        />
        <CaptureCreateModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onCreateSuccess={handleCreateSuccess}
          initialPosition={createPosition ?? undefined}
        />
      </div>
      </NodeClickContext.Provider>
    </NodeTitleClickContext.Provider>
  );
};
