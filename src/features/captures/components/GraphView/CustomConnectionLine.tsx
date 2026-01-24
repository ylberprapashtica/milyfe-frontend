import { getStraightPath, ConnectionLineComponentProps } from '@xyflow/react';

/**
 * CustomConnectionLine component that provides visual feedback while
 * dragging to create a connection between nodes.
 * 
 * @param props - Connection line props from React Flow
 * @returns The rendered connection line SVG element
 */
function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}: ConnectionLineComponentProps) {
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path style={connectionLineStyle} fill="none" d={edgePath} />
    </g>
  );
}

export default CustomConnectionLine;
