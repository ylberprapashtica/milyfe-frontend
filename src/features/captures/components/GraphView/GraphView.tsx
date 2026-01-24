import { useEffect, useState, useCallback, ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Handle,
  Position,
  Connection,
  addEdge,
  useConnection,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { capturesService } from '@/features/captures/services/captures.service';
import { GraphData } from '@/features/captures/types';
import FloatingEdge from './FloatingEdge';
import CustomConnectionLine from './CustomConnectionLine';
import './GraphView.scss';

/**
 * Props for the GraphView component
 */
export interface GraphViewProps {
  /** Optional filter by tags */
  tagFilter?: string[];
}

/**
 * Node data type for our custom nodes
 */
interface NoteNodeData extends Record<string, unknown> {
  label: string;
  tags: string[];
  captureId: number;
  slug: string;
}

/**
 * Edge data type for storing link metadata
 */
interface EdgeData extends Record<string, unknown> {
  linkId?: number;
}

/**
 * Custom node component for displaying notes with easy connect functionality
 */
const NoteNode = ({ id, data }: { id: string; data: NoteNodeData }) => {
  const connection = useConnection();

  const isConnecting = connection.inProgress;
  const isTarget = isConnecting && connection.fromNode.id !== id;

  return (
    <div className="graph-node">
     
      {/* Handles outside body to cover entire node */}
      {!isConnecting && (
        <Handle
          className="customHandle"
          position={Position.Right}
          type="source"
        />
      )}
      {isTarget && (
        <Handle
          className="customHandle"
          position={Position.Left}
          type="target"
          isConnectableStart={false}
        />
      )}
      <div className="graph-node-body">
        <div className="graph-node-title">{data.label}</div>
        {data.tags && data.tags.length > 0 && (
          <div className="graph-node-tags">
            {data.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="graph-node-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="drag-handle__custom" title="Drag to move">
        ⋮⋮
      </div>
    </div>
  );
};

const nodeTypes = {
  note: NoteNode,
} as const;

const edgeTypes = {
  floating: FloatingEdge,
} as const;

const defaultEdgeOptions = {
  type: 'floating' as const,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#0066cc',
  },
};

const connectionLineStyle = {
  stroke: '#0066cc',
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
export const GraphView = ({ tagFilter }: GraphViewProps): ReactElement => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NoteNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<EdgeData>>([]);

  /**
   * Handle node click to navigate to note detail
   * Don't navigate if user is dragging or connecting
   */
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<NoteNodeData>) => {
    // Don't navigate if this was a drag or connection attempt
    if (_event.defaultPrevented) {
      return;
    }
    
    const captureId = node.data?.captureId;
    if (captureId) {
      navigate(`/captures/${captureId}`);
    }
  }, [navigate]);

  /**
   * Handle node drag stop to save position
   */
  const onNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node<NoteNodeData>) => {
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
    } catch (err) {
      console.error('Error creating link:', err);
      setError('Failed to create connection. Please try again.');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  }, [nodes, setEdges]);

  /**
   * Handle clicking on an edge to delete it
   */
  const onEdgeClick = useCallback(async (_event: React.MouseEvent, edge: Edge<EdgeData>) => {
    const linkId = edge.data?.linkId;

    if (!linkId) {
      console.error('Link ID not found in edge data');
      return;
    }

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    try {
      // Call API to delete link
      await capturesService.deleteLink(linkId);

      // Remove edge from graph
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    } catch (err) {
      console.error('Error deleting link:', err);
      setError('Failed to delete connection. Please try again.');
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  }, [setEdges]);

  /**
   * Load graph data from API
   */
  const loadGraphData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const graphData: GraphData = await capturesService.getGraphData();
      
      // Convert API data to React Flow format
      const flowNodes: Node<NoteNodeData>[] = graphData.nodes.map((node) => ({
        id: node.id,
        type: 'note' as const,
        position: node.position,
        data: node.data as NoteNodeData,
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

      // Apply tag filter if provided
      let filteredNodes: Node<NoteNodeData>[] = flowNodes;
      let filteredEdges: Edge<EdgeData>[] = flowEdges;

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

      setNodes(filteredNodes);
      setEdges(filteredEdges);
    } catch (err) {
      setError('Failed to load graph data. Please try again.');
      console.error('Error loading graph data:', err);
    } finally {
      setLoading(false);
    }
  }, [tagFilter, setNodes, setEdges]);

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
    <div className="graph-view">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // onNodeClick={onNodeClick} // Temporarily disabled to test connections
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={CustomConnectionLine}
        connectionLineStyle={connectionLineStyle}
        connectionMode={ConnectionMode.Loose}
        connectOnClick={false}
        nodesConnectable={true}
        elementsSelectable={true}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
