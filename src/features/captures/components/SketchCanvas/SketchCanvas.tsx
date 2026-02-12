import { useRef, useState, ReactElement, forwardRef, useImperativeHandle } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import './SketchCanvas.scss';

const SKETCH_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#e53935' },
  { name: 'Blue', value: '#1e88e5' },
  { name: 'Green', value: '#43a047' },
  { name: 'Purple', value: '#8e24aa' },
  { name: 'Orange', value: '#fb8c00' },
];

/**
 * Props for the SketchCanvas component
 */
export interface SketchCanvasProps {
  /** Existing sketch to display as background (for edit mode) */
  initialSketch?: string | null;
  /** Callback when user clears/removes the sketch */
  onClearSketch?: () => void;
}

export interface SketchCanvasRef {
  exportImage: () => Promise<string>;
}

const canvasStyles = {
  border: '1px solid #9c9c9c',
  borderRadius: '4px',
};

/**
 * Sketch canvas component for freehand drawing
 *
 * Wraps react-sketch-canvas with pen/eraser toggle, undo/redo, clear,
 * and color picker. Sketch is exported when parent calls exportImage via ref.
 */
export const SketchCanvas = forwardRef<SketchCanvasRef, SketchCanvasProps>(
  ({ initialSketch, onClearSketch }, ref): ReactElement => {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [isEraserMode, setIsEraserMode] = useState(false);
    const [strokeColor, setStrokeColor] = useState(SKETCH_COLORS[0].value);

    useImperativeHandle(ref, () => ({
      exportImage: async () => {
        if (!canvasRef.current) return '';
        return canvasRef.current.exportImage('png');
      },
    }));

    const handleClear = (): void => {
      canvasRef.current?.clearCanvas();
      onClearSketch?.();
    };

  const handleUndo = (): void => {
    canvasRef.current?.undo();
  };

  const handleRedo = (): void => {
    canvasRef.current?.redo();
  };

  const handleReset = (): void => {
    canvasRef.current?.resetCanvas();
    onClearSketch?.();
  };

  return (
    <div className="sketch-canvas">
      <div className="sketch-canvas-toolbar">
        <button
          type="button"
          className={`sketch-canvas-tool ${!isEraserMode ? 'sketch-canvas-tool--active' : ''}`}
          onClick={() => {
            setIsEraserMode(false);
            canvasRef.current?.eraseMode(false);
          }}
          title="Pen"
        >
          Pen
        </button>
        <button
          type="button"
          className={`sketch-canvas-tool ${isEraserMode ? 'sketch-canvas-tool--active' : ''}`}
          onClick={() => {
            setIsEraserMode(true);
            canvasRef.current?.eraseMode(true);
          }}
          title="Eraser"
        >
          Eraser
        </button>
        <div className="sketch-canvas-colors">
          {SKETCH_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`sketch-canvas-color ${strokeColor === color.value ? 'sketch-canvas-color--active' : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={() => {
                if (!isEraserMode) {
                  setStrokeColor(color.value);
                  canvasRef.current?.eraseMode(false);
                }
              }}
              title={color.name}
              disabled={isEraserMode}
            />
          ))}
        </div>
        <button type="button" className="sketch-canvas-tool" onClick={handleUndo} title="Undo">
          Undo
        </button>
        <button type="button" className="sketch-canvas-tool" onClick={handleRedo} title="Redo">
          Redo
        </button>
        <button type="button" className="sketch-canvas-tool" onClick={handleClear} title="Clear">
          Clear
        </button>
        {initialSketch && (
          <button
            type="button"
            className="sketch-canvas-tool"
            onClick={handleReset}
            title="Start over"
          >
            Start over
          </button>
        )}
      </div>

      <div className="sketch-canvas-wrapper">
        <ReactSketchCanvas
          ref={canvasRef}
          style={canvasStyles}
          width="100%"
          height="300px"
          strokeWidth={4}
          strokeColor={strokeColor}
          eraserWidth={12}
          backgroundImage={initialSketch || undefined}
          exportWithBackgroundImage={!!initialSketch}
          preserveBackgroundImageAspectRatio="xMidYMid meet"
        />
      </div>
    </div>
  );
});
