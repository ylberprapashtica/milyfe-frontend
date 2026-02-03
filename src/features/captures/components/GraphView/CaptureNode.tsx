import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Handle,
  Position,
  useConnection,
} from '@xyflow/react';
import './CaptureNode.scss';

/**
 * Node data type for our custom capture nodes
 */
export interface CaptureNodeData extends Record<string, unknown> {
  label: string;
  tags: string[];
  captureId: number;
  slug: string;
  content?: string;
  updated_at?: string;
  status?: string;
  statusColor?: string;
  type?: string;
  typeSymbol?: string;
}

/**
 * Custom node component for displaying captures with easy connect functionality
 */
export const CaptureNode = ({ id, data }: { id: string; data: CaptureNodeData }) => {
  const navigate = useNavigate();
  const connection = useConnection();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const contentRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // Check if content is truncated by comparing scrollHeight with clientHeight
      setShowExpandButton(node.scrollHeight > node.clientHeight);
    }
  }, []);

  const isConnecting = connection.inProgress;
  const isTarget = isConnecting && connection.fromNode.id !== id;

  /**
   * Check if the node was updated within the last minute
   */
  const isRecentlyUpdated = (): boolean => {
    if (!data.updated_at) return false;
    const now = new Date().getTime();
    const updatedAt = new Date(data.updated_at).getTime();
    const oneMinuteInMs = 60 * 1000;
    return now - updatedAt < oneMinuteInMs;
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  /**
   * Handle opening the capture detail page
   */
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/captures/${data.captureId}`);
  };

  const recentlyUpdated = isRecentlyUpdated();
  const status = data.status || 'fleeting';

  /**
   * Get status display class
   */
  const getStatusClass = (status: string): string => {
    return `graph-node--status-${status}`;
  };

  /**
   * Get border style for status
   */
  const getBorderStyle = (): React.CSSProperties => {
    if (data.statusColor) {
      return {
        borderLeft: `3px solid ${data.statusColor}`,
      };
    }
    return {};
  };

  return (
    <div 
      className={`graph-node ${isExpanded ? 'graph-node--expanded' : ''} ${recentlyUpdated ? 'graph-node--recently-updated' : ''} ${getStatusClass(status)}`}
      style={getBorderStyle()}
    >
      {/* Type symbol background */}
      {data.typeSymbol && (
        <div className="graph-node-type-symbol">{data.typeSymbol}</div>
      )}
      {/* Connection handles - small circle in top-left corner */}
      <Handle
        className="graph-node-connection-handle graph-node-connection-handle--source"
        position={Position.Top}
        type="source"
      />
      {isTarget && (
        <Handle
          className="graph-node-connection-handle graph-node-connection-handle--target"
          position={Position.Top}
          type="target"
          isConnectableStart={false}
        />
      )}
      {showExpandButton && (
        <button 
          className="graph-node-expand-button" 
          onClick={toggleExpand}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? "▲" : "▼"}
        </button>
      )}
      <div className="graph-node-body">
        <div 
          className="graph-node-title"
          onClick={handleOpen}
          title="Click to open/edit"
        >
          {data.label}
        </div>
        <div 
          ref={contentRef}
          className={`graph-node-content ${isExpanded ? 'graph-node-content--expanded' : ''}`}
        >
          {data.content}
        </div>
      </div>
      <div className="drag-handle__custom" title="Drag to move">
        ⋮⋮
      </div>
    </div>
  );
};
