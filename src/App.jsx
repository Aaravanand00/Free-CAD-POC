import React, { useState, useEffect, useRef, useMemo } from 'react';
import './styles/base.css';
import { GeometryEngine, ShapeType, PointType } from './core/GeometryEngine';
import { SnapManager } from './core/SnapManager';
import { MeasurementEngine } from './core/MeasurementEngine';
import { CollaborationEngine } from './core/CollaborationEngine';
import { MousePointer, Minus, Square, Circle, Ruler, MessageSquare, Info, Settings, ArrowRight } from 'lucide-react';

const App = () => {
  // Engines (stable instances)
  const geometryEngine = useMemo(() => new GeometryEngine(), []);
  const snapManager = useMemo(() => new SnapManager(geometryEngine), [geometryEngine]);
  const measurementEngine = useMemo(() => new MeasurementEngine(geometryEngine), [geometryEngine]);
  const collaborationEngine = useMemo(() => new CollaborationEngine(geometryEngine), [geometryEngine]);

  // UI State
  const [activeTool, setActiveTool] = useState('select');
  const [shapes, setShapes] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [currentSnap, setCurrentSnap] = useState(null);
  const [drawingShape, setDrawingShape] = useState(null);
  const [measurementRefs, setMeasurementRefs] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // Sync React state with engine truth
  const refreshEngineState = () => {
    setShapes([...geometryEngine.getShapes()]);
    setMeasurements([...measurementEngine.getMeasurements()]);
    setAnnotations([...collaborationEngine.getAnnotations()]);
  };

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const snap = snapManager.resolveSnap(offsetX, offsetY);
    const point = snap ? { x: snap.x, y: snap.y } : { x: offsetX, y: offsetY };

    if (activeTool === ShapeType.LINE) {
      setDrawingShape({ type: ShapeType.LINE, p1: point, p2: point });
    } else if (activeTool === ShapeType.RECTANGLE) {
      setDrawingShape({ type: ShapeType.RECTANGLE, p1: point, p2: point });
    } else if (activeTool === ShapeType.CIRCLE) {
      setDrawingShape({ type: ShapeType.CIRCLE, center: point, radius: 0 });
    } else if (activeTool === 'measure') {
      if (snap) {
        setMeasurementRefs((prev) => {
          const next = [...prev, snap.ref];
          if (next.length === 2) {
            measurementEngine.addMeasurement(next[0], next[1]);
            refreshEngineState();
            return [];
          }
          return next;
        });
      }
    } else if (activeTool === 'annotate') {
      if (snap) {
        const text = prompt(`Annotation for ${snap.ref}:`);
        if (text) {
          collaborationEngine.addAnnotation(snap.ref, text);
          refreshEngineState();
        }
      }
    } else if (activeTool === 'select') {
      // Find shape near mouse
      const hitShape = shapes.find(s => {
        const points = geometryEngine.getSemanticPoints(s);
        return points.some(p => Math.sqrt(Math.pow(p.x - offsetX, 2) + Math.pow(p.y - offsetY, 2)) < 20);
      });
      setSelectedShapeId(hitShape?.id || null);
    }
  };

  const handleMouseMove = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setMousePos({ x: offsetX, y: offsetY });

    const snap = snapManager.resolveSnap(offsetX, offsetY);
    setCurrentSnap(snap);

    if (drawingShape) {
      const point = snap ? { x: snap.x, y: snap.y } : { x: offsetX, y: offsetY };
      if (drawingShape.type === ShapeType.LINE || drawingShape.type === ShapeType.RECTANGLE) {
        setDrawingShape({ ...drawingShape, p2: point });
      } else if (drawingShape.type === ShapeType.CIRCLE) {
        const dx = point.x - drawingShape.center.x;
        const dy = point.y - drawingShape.center.y;
        setDrawingShape({ ...drawingShape, radius: Math.sqrt(dx * dx + dy * dy) });
      }
    }
  };

  const handleMouseUp = () => {
    if (drawingShape) {
      geometryEngine.addShape(drawingShape.type, drawingShape);
      setDrawingShape(null);
      refreshEngineState();
    }
  };

  const updateSelectedShapeParam = (paramKey, value) => {
    if (!selectedShapeId) return;
    const shape = geometryEngine.getShapeById(selectedShapeId);
    if (!shape) return;

    let newParams = { ...shape.params };
    if (paramKey.includes('.')) {
      const [p, k] = paramKey.split('.');
      newParams[p] = { ...newParams[p], [k]: parseFloat(value) };
    } else {
      newParams[paramKey] = parseFloat(value);
    }

    geometryEngine.updateShape(selectedShapeId, newParams);
    refreshEngineState();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Shapes
      shapes.forEach(shape => {
        const isSelected = selectedShapeId === shape.id;
        ctx.strokeStyle = isSelected ? '#fbbf24' : '#38bdf8';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.beginPath();
        if (shape.type === ShapeType.LINE) {
          ctx.moveTo(shape.params.p1.x, shape.params.p1.y);
          ctx.lineTo(shape.params.p2.x, shape.params.p2.y);
        } else if (shape.type === ShapeType.RECTANGLE) {
          const { p1, p2 } = shape.params;
          ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        } else if (shape.type === ShapeType.CIRCLE) {
          ctx.arc(shape.params.center.x, shape.params.center.y, shape.params.radius, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Draw semantic points if selected
        if (isSelected) {
          const points = geometryEngine.getSemanticPoints(shape);
          points.forEach(p => {
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

      // Drawing Preview
      if (drawingShape) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        if (drawingShape.type === ShapeType.LINE) {
          ctx.moveTo(drawingShape.p1.x, drawingShape.p1.y);
          ctx.lineTo(drawingShape.p2.x, drawingShape.p2.y);
        } else if (drawingShape.type === ShapeType.RECTANGLE) {
          ctx.rect(drawingShape.p1.x, drawingShape.p1.y, drawingShape.p2.x - drawingShape.p1.x, drawingShape.p2.y - drawingShape.p1.y);
        } else if (drawingShape.type === ShapeType.CIRCLE) {
          ctx.arc(drawingShape.center.x, drawingShape.center.y, drawingShape.radius, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Measurements (DYNAMICALLY RECOMPUTED HERE via measurementEngine.getMeasurements())
      measurementEngine.getMeasurements().forEach(m => {
        if (!m.isValid) return;
        ctx.strokeStyle = '#818cf8';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(m.p1.x, m.p1.y);
        ctx.lineTo(m.p2.x, m.p2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#818cf8';
        ctx.font = '600 12px Inter';
        const midX = (m.p1.x + m.p2.x) / 2;
        const midY = (m.p1.y + m.p2.y) / 2;
        ctx.fillText(`${m.distance}px`, midX + 10, midY - 10);
      });

      // Snapping Crosshair
      if (currentSnap) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(currentSnap.x, currentSnap.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px Inter';
        ctx.fillText(`${currentSnap.type.toUpperCase()} SNAP`, currentSnap.x + 12, currentSnap.y - 12);
        ctx.fillText(currentSnap.ref, currentSnap.x + 12, currentSnap.y + 2);
      }
    };

    render();
  }, [shapes, drawingShape, currentSnap, selectedShapeId, measurements]);

  const selectedShape = useMemo(() => shapes.find(s => s.id === selectedShapeId), [shapes, selectedShapeId]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="header">
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <div style={{width:'12px', height:'12px', background:'var(--primary-color)', borderRadius:'2px'}}></div>
            <h1 style={{fontSize: '1.2rem', fontWeight:'800'}}>FreeCAD PoC</h1>
          </div>
          <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop:'0.2rem'}}>Parametric Reference System</p>
        </div>

        {selectedShape ? (
          <div className="card active-card" style={{borderColor: 'var(--primary-color)'}}>
            <h3><Settings size={14} style={{verticalAlign:'middle', marginRight:'5px'}} /> PROPERTIES: {selectedShape.id}</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem'}}>
              {selectedShape.type === 'circle' && (
                <>
                  <label>Radius</label>
                  <input type="range" min="10" max="300" value={selectedShape.params.radius} onChange={(e) => updateSelectedShapeParam('radius', e.target.value)} />
                  <label>Center X</label>
                  <input type="number" value={selectedShape.params.center.x} onChange={(e) => updateSelectedShapeParam('center.x', e.target.value)} />
                </>
              )}
              {selectedShape.type === 'rectangle' && (
                <>
                  <label>Position X</label>
                  <input type="number" value={selectedShape.params.p1.x} onChange={(e) => updateSelectedShapeParam('p1.x', e.target.value)} />
                  <label>Position Y</label>
                  <input type="number" value={selectedShape.params.p1.y} onChange={(e) => updateSelectedShapeParam('p1.y', e.target.value)} />
                </>
              )}
              <button onClick={() => setSelectedShapeId(null)} style={{marginTop:'0.5rem', padding:'0.4rem', borderRadius:'4px', background:'rgba(255,255,255,0.1)', border:'none', color:'white', cursor:'pointer'}}>Deselect</button>
            </div>
          </div>
        ) : (
          <div className="card">
            <h3>MODELS</h3>
            <div className="list">
              {shapes.map(s => (
                <div key={s.id} className="list-item" onClick={() => setSelectedShapeId(s.id)} style={{cursor:'pointer'}}>
                  <span>{s.id}</span>
                  <ArrowRight size={14} />
                </div>
              ))}
              {shapes.length === 0 && <p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Double click to draw or select a tool.</p>}
            </div>
          </div>
        )}

        <div className="card">
          <h3>MEASUREMENTS</h3>
          <div className="list">
            {measurements.map(m => (
              <div key={m.id} className="list-item">
                <span style={{fontSize: '0.75rem'}}>{m.ref1.split('@')[0]} : {m.ref2.split('@')[0]}</span>
                <span style={{color: 'var(--secondary-color)', fontWeight:'bold'}}>{m.distance}px</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>COLLABORATION</h3>
          <div className="list">
            {annotations.map(a => (
              <div key={a.id} className="list-item" onClick={() => setSelectedAnnotation(a)} style={{flexDirection: 'column', gap: '0.2rem', cursor:'pointer'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                  <strong style={{fontSize:'0.7rem', color:'var(--accent-color)'}}>{a.ref}</strong>
                </div>
                <p style={{fontSize: '0.8rem'}}>{a.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginTop: 'auto', background:'rgba(56, 189, 248, 0.1)', padding:'1rem', borderRadius:'8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)'}}>
            <Info size={16} />
            <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>CAD Core Ready</span>
          </div>
          <p style={{fontSize: '0.7rem', marginTop: '0.4rem', color: 'var(--text-muted)'}}>
            All points are parametric. Snapping is resolved by priority: Vertex &gt; Center &gt; Midpoint.
          </p>
        </div>
      </aside>

      <main className="canvas-container" onMouseMove={handleMouseMove}>
        <div className="toolbar">
          <button title="Select Shape" className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`} onClick={() => setActiveTool('select')}><MousePointer size={20} /></button>
          <button title="Draw Line" className={`tool-btn ${activeTool === ShapeType.LINE ? 'active' : ''}`} onClick={() => setActiveTool(ShapeType.LINE)}><Minus size={20} /></button>
          <button title="Draw Rectangle" className={`tool-btn ${activeTool === ShapeType.RECTANGLE ? 'active' : ''}`} onClick={() => setActiveTool(ShapeType.RECTANGLE)}><Square size={20} /></button>
          <button title="Draw Circle" className={`tool-btn ${activeTool === ShapeType.CIRCLE ? 'active' : ''}`} onClick={() => setActiveTool(ShapeType.CIRCLE)}><Circle size={20} /></button>
          <button title="Measure" className={`tool-btn ${activeTool === 'measure' ? 'active' : ''}`} onClick={() => setActiveTool('measure')}><Ruler size={20} /></button>
          <button title="Annotate" className={`tool-btn ${activeTool === 'annotate' ? 'active' : ''}`} onClick={() => setActiveTool('annotate')}><MessageSquare size={20} /></button>
        </div>

        <canvas 
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          style={{ width: '100%', height: '100%', cursor: currentSnap ? 'crosshair' : 'default' }}
        />

        {annotations.map(a => a.isValid && (
          <div 
            key={a.id} 
            className="annotation-marker"
            style={{ left: a.point.x, top: a.point.y }}
            onClick={() => setSelectedAnnotation(a)}
          />
        ))}

        {selectedAnnotation && (
          <div className="annotation-popup" style={{ left: selectedAnnotation.point.x + 20, top: selectedAnnotation.point.y - 40 }}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
              <strong>{selectedAnnotation.ref}</strong>
              <button onClick={() => setSelectedAnnotation(null)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer'}}>X</button>
            </div>
            <p style={{fontSize:'0.9rem', marginBottom:'0.5rem'}}>{selectedAnnotation.text}</p>
            <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>
              Author: {selectedAnnotation.author}
            </div>
          </div>
        )}

        <div className="status-bar">
          <div>X: {mousePos.x} Y: {mousePos.y}</div>
          <div>{currentSnap ? `SNAP: ${currentSnap.ref}` : activeTool.toUpperCase()}</div>
          {measurementRefs.length > 0 && <div style={{color:'var(--secondary-color)'}}>SELECT SECOND POINT...</div>}
        </div>
      </main>
    </div>
  );
};

export default App;
