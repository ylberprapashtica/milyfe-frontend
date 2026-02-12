import { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import './ProjectNode.scss';

export interface ProjectNodeData {
  label: string;
  projectId: number | string;
}

interface ProjectNodeProps {
  id: string;
  data: ProjectNodeData;
  selected?: boolean;
}

/**
 * Resizable project/group node for the graph view.
 * Displays a project container that can be resized when selected.
 */
export const ProjectNode = memo(({ data, selected }: ProjectNodeProps) => {
  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="project-node-resizer-line"
        handleClassName="project-node-resizer-handle"
      />
      <div className="project-node">
        <div className="project-node-label">{data.label}</div>
      </div>
    </>
  );
});

ProjectNode.displayName = 'ProjectNode';
