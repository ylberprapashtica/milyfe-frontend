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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { capturesService } from '@/features/captures/services/captures.service';
import { GraphData } from '@/features/captures/types';
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
 * Custom node component for displaying notes
 */
const NoteNode = ({ data }: { data: NoteNodeData }) => {
  return (
    <div className="graph-node">
      <div className="drag-handle__custom" title="Drag to move">
        ⋮⋮
      </div>
      <Handle type="target" position={Position.Top} />
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
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  note: NoteNode,
};

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
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  /**
   * Handle node click to navigate to note detail
   */
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<NoteNodeData>) => {
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
      }));

      // Create a Set of all valid node IDs for edge validation
      const validNodeIds = new Set(flowNodes.map((node) => node.id));

      // Convert edges and validate they reference existing nodes
      const flowEdges: Edge[] = graphData.edges
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
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep' as const,
          animated: true,
        }));

      // Apply tag filter if provided
      let filteredNodes: Node<NoteNodeData>[] = flowNodes;
      let filteredEdges: Edge[] = flowEdges;

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
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
