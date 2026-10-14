import React, { useState, useRef } from 'react';
import styled from 'styled-components';

export const isPointInPolygon = (point, vs) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const ZoneEditor = ({ zonePoints, setZonePoints, hasBreach, isDrawing, setIsDrawing }) => {
  const [mousePos, setMousePos] = useState(null);
  const containerRef = useRef(null);

  const handleCanvasClick = (e) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Snap to close if clicking within 5% of the initial point
    if (zonePoints.length >= 2) {
      const startPt = zonePoints[0];
      const dist = Math.hypot(x - startPt[0], y - startPt[1]);
      if (dist < 5) {
        setIsDrawing(false);
        setMousePos(null);
        return;
      }
    }
    setZonePoints(prev => [...prev, [x, y]]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || zonePoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos([x, y]);
  };

  const getSvgPoints = () => zonePoints.map(p => `${p[0]},${p[1]}`).join(' ');

  return (
    <ZoneOverlayWrapper 
      ref={containerRef}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos(null)}
      $isDrawing={isDrawing}
    >
      <svg className="zone-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Active Drawing Line */}
        {isDrawing && zonePoints.length > 0 && mousePos && (
          <line 
            x1={zonePoints[zonePoints.length - 1][0]} 
            y1={zonePoints[zonePoints.length - 1][1]} 
            x2={mousePos[0]} 
            y2={mousePos[1]} 
            className="active-draw-line"
          />
        )}

        {/* Closed Polygon vs Active Polyline */}
        {zonePoints.length > 0 && (
          !isDrawing && zonePoints.length > 2 ? (
            <polygon points={getSvgPoints()} className={`zone-polygon ${hasBreach ? 'alert' : ''}`} />
          ) : (
            <polyline points={getSvgPoints()} className="zone-polyline" />
          )
        )}

        {/* Snapping point circle */}
        {isDrawing && zonePoints.length >= 2 && mousePos && 
          Math.hypot(mousePos[0] - zonePoints[0][0], mousePos[1] - zonePoints[0][1]) < 5 && (
          <circle cx={zonePoints[0][0]} cy={zonePoints[0][1]} r="3.5" className="snap-dot" />
        )}

        {/* Anchor Dots */}
        {zonePoints.map((p, idx) => (
          <circle key={idx} cx={p[0]} cy={p[1]} r="1.8" className="zone-dot" />
        ))}
      </svg>
    </ZoneOverlayWrapper>
  );
};

const ZoneOverlayWrapper = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: ${props => props.$isDrawing ? 'auto' : 'none'};
  cursor: ${props => props.$isDrawing ? 'crosshair' : 'default'};

  .zone-svg { width: 100%; height: 100%; overflow: visible; }
  .zone-polyline, .active-draw-line { fill: none; stroke: #00FFFF; stroke-width: 0.8; stroke-dasharray: 1.5; }
  .zone-polygon { fill: rgba(0, 255, 255, 0.18); stroke: #00FFFF; stroke-width: 0.8; }
  .zone-polygon.alert { fill: rgba(239, 68, 68, 0.45); stroke: #ef4444; stroke-width: 1.2; }
  .zone-dot { fill: #00FFFF; }
  .snap-dot { fill: #ef4444; stroke: #fff; stroke-width: 0.5; }
`;

export default ZoneEditor;