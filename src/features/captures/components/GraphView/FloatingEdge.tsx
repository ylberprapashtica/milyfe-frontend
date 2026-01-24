import { BaseEdge, getStraightPath, useInternalNode, EdgeProps } from '@xyflow/react';
import { getEdgeParams } from './edgeUtils';

/**
 * FloatingEdge component that dynamically calculates edge connection points
 * based on node positions, creating edges that connect to the nearest points
 * on node boundaries rather than fixed handle positions.
 * 
 * @param props - Edge properties from React Flow
 * @returns The rendered edge component or null if nodes are not found
 */
function FloatingEdge(props: EdgeProps) {
  const { id, source, target, markerEnd, style } = props;
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

  const [path] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={style}
    />
  );
}

export default FloatingEdge;
