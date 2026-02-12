import { useEffect, useState, useCallback, useRef, ReactElement, createContext, useContext } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
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
import { GraphData, Capture } from '@/features/captures/types';
import { CaptureNode, CaptureNodeData } from './CaptureNode';
import FloatingEdge from './FloatingEdge';
import CustomConnectionLine from './CustomConnectionLine';
import { ConfirmModal } from '@/common/components/ui';
import { CaptureEditModal } from '@/features/captures/components/CaptureEditModal';
import { CaptureCreateModal } from '@/features/captures/components/CaptureCreateModal';
import './GraphView.scss';

/**
 * Context for passing onTitleClick callback to CaptureNode
 */
const NodeTitleClickContext = createContext<((captureId: number) => void) | undefined>(undefined);

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
}

/**
 * Edge data type for storing link metadata
 */
interface EdgeData extends Record<string, unknown> {
  linkId?: number;
  filtered?: boolean;
}

/**
 * Wrapper component for CaptureNode that uses context for onTitleClick
 */
const CaptureNodeWithContext = (props: { id: string; data: CaptureNodeData }) => {
  const onTitleClick = useContext(NodeTitleClickContext);
  return <CaptureNode {...props} onTitleClick={onTitleClick} />;
};

const nodeTypes = {
  note: CaptureNodeWithContext,
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
export const GraphView = ({ tagFilter, statusFilter, typeFilter }: GraphViewProps): ReactElement => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CaptureNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<EdgeData>>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [edgeToDelete, setEdgeToDelete] = useState<Edge<EdgeData> | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editCaptureId, setEditCaptureId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createPosition, setCreatePosition] = useState<{ x: number; y: number } | null>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance<Node<CaptureNodeData>, Edge<EdgeData>> | null>(null);

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
   * Handle edit modal close
   */
  const handleCloseEditModal = useCallback(() => {
    // Clear captureId first to prevent modal from reopening
    setEditCaptureId(null);
    // Then close the modal
    setShowEditModal(false);
  }, []);

  /**
   * Handle node title click - open edit modal
   */
  const handleNodeTitleClick = useCallback((captureId: number) => {
    setEditCaptureId(captureId);
    setShowEditModal(true);
  }, []);

  /**
   * Store React Flow instance on init (for screenToFlowPosition)
   */
  const onInit = useCallback((instance: ReactFlowInstance<Node<CaptureNodeData>, Edge<EdgeData>>) => {
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
   * Handle node drag stop to save position
   */
  const onNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node<CaptureNodeData>) => {
    const captureId = node.data?.captureId;
    if (captureId && node.position) {
      try {
        await capturesService.updateCapturePosition(
          captureId,
          node.position.x,
          node.position.y
        );
      } catch (err) {
        console.error('Error saving node position:', err);
        // Don't show error to user as it's a background operation
      }
    }
  }, []);

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

    const sourceCaptureId = sourceNode.data?.captureId;
    const targetCaptureId = targetNode.data?.captureId;

    if (!sourceCaptureId || !targetCaptureId) {
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
      const flowNodes: Node<CaptureNodeData>[] = graphData.nodes.map((node) => ({
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
      let filteredNodes: Node<CaptureNodeData>[] = flowNodes;
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
          const nodeStatus = node.data?.status || '';
          const nodeType = node.data?.type || '';
          
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

      setNodes(filteredNodes);
      setEdges(filteredEdges);
    } catch (err) {
      setError('Failed to load graph data. Please try again.');
      console.error('Error loading graph data:', err);
    } finally {
      setLoading(false);
    }
  }, [tagFilter, statusFilter, typeFilter, setNodes, setEdges]);

  /**
   * Handle successful capture update - update only the specific node
   */
  const handleUpdateSuccess = useCallback((updatedCapture: Capture) => {
    // Find the node ID for this capture
    const nodeId = nodes.find((node) => node.data.captureId === updatedCapture.id)?.id;
    
    if (!nodeId) {
      // If node not found, fall back to reloading all data
      loadGraphData();
      return;
    }

    // Update only the specific node with the new data
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: updatedCapture.title || updatedCapture.content.split('\n')[0] || 'Untitled',
              content: updatedCapture.content,
              tags: updatedCapture.tags || [],
              updated_at: updatedCapture.updated_at,
              status: updatedCapture.capture_status?.name || 'fleeting',
              statusColor: updatedCapture.capture_status?.color || undefined,
              type: updatedCapture.capture_type?.name || undefined,
              typeSymbol: updatedCapture.capture_type?.symbol || undefined,
            },
          };
        }
        return node;
      })
    );
  }, [nodes, setNodes, loadGraphData]);

  /**
   * Handle successful capture creation - reload graph to show new node
   */
  const handleCreateSuccess = useCallback(() => {
    loadGraphData();
  }, [loadGraphData]);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

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
    <NodeTitleClickContext.Provider value={handleNodeTitleClick}>
      <div className="graph-view">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
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
          <Controls />
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
        <CaptureEditModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          captureId={editCaptureId}
          onUpdateSuccess={handleUpdateSuccess}
        />
        <CaptureCreateModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onCreateSuccess={handleCreateSuccess}
          initialPosition={createPosition ?? undefined}
        />
      </div>
    </NodeTitleClickContext.Provider>
  );
};
