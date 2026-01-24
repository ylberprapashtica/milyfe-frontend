import { Position } from '@xyflow/react';

// Define internal node type with the properties we need
interface InternalNode {
  id: string;
  position: { x: number; y: number };
  measured?: { 
    width?: number; 
    height?: number;
  };
  internals?: {
    positionAbsolute: { x: number; y: number };
  };
}

/**
 * Calculates the intersection point of a line between the center of the intersection node
 * and the target node with the intersection node's boundary.
 * 
 * @param intersectionNode - The node to find the intersection point on
 * @param targetNode - The node to draw the line towards
 * @returns The x, y coordinates of the intersection point
 */
function getNodeIntersection(intersectionNode: InternalNode, targetNode: InternalNode) {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const { width: intersectionNodeWidth = 0, height: intersectionNodeHeight = 0 } =
    intersectionNode.measured || {};
  const intersectionNodePosition = intersectionNode.internals?.positionAbsolute || intersectionNode.position;
  const targetPosition = targetNode.internals?.positionAbsolute || targetNode.position;

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + (targetNode.measured?.width || 0) / 2;
  const y1 = targetPosition.y + (targetNode.measured?.height || 0) / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

/**
 * Determines the position (top, right, bottom, or left) of a node
 * relative to an intersection point.
 * 
 * @param node - The node to check position for
 * @param intersectionPoint - The point to compare against
 * @returns The position enum value
 */
function getEdgePosition(node: InternalNode, intersectionPoint: { x: number; y: number }) {
  const nodePosition = node.internals?.positionAbsolute || node.position;
  const n = { ...nodePosition, ...node };
  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  const width = node.measured?.width || 0;
  const height = node.measured?.height || 0;

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= ny + height - 1) {
    return Position.Bottom;
  }

  return Position.Top;
}

/**
 * Calculates all parameters needed to render an edge between two nodes.
 * Returns the source and target coordinates, as well as their handle positions.
 * 
 * @param source - The source node
 * @param target - The target node
 * @returns Object containing sx, sy, tx, ty, sourcePos, targetPos
 */
export function getEdgeParams(source: InternalNode, target: InternalNode) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}
