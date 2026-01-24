import { useCallback, useState } from 'react';
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
}

/**
 * Custom node component for displaying captures with easy connect functionality
 */
export const CaptureNode = ({ id, data }: { id: string; data: CaptureNodeData }) => {
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

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`graph-node ${isExpanded ? 'graph-node--expanded' : ''}`}>
     
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
        <div className="graph-node-title">{data.label}</div>
         {data.tags && data.tags.length > 0 && (
          <div className="graph-node-tags">
            {data.tags.map((tag, index) => (
              <span key={index} className="graph-node-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
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
