import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import ZoneEditButton from './ZoneEditButton';
import ZoneEditor, { isPointInPolygon } from './ZoneEditor';
import toast from 'react-hot-toast';
import { speakAlert } from '../utils/voiceAlert';

const CameraNode = ({ camId, name, streamUrl, type }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [zoneActive, setZoneActive] = useState(false);
  
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem(`sentinel_zone_${camId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [detections, setDetections] = useState([]);
  const [frameSize, setFrameSize] = useState([640, 480]);
  const [isBreached, setIsBreached] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const lastBreachTime = useRef(0);
  const breachTimeoutRef = useRef(null); // Used to keep the alarm on for 10 seconds

  useEffect(() => {
    if (points.length > 0) {
      localStorage.setItem(`sentinel_zone_${camId}`, JSON.stringify(points));
    } else {
      localStorage.removeItem(`sentinel_zone_${camId}`);
    }
  }, [points, camId]);

  useEffect(() => {
    if (type !== 'WEBCAM' && (!streamUrl || streamUrl === '')) {
      setIsConnected(false);
      return;
    }

    let ws = null;
    let objectUrl = null;

    const connectWebSocket = () => {
      const wsUrl = camId === 'cam_local_01'
        ? `ws://localhost:8000/ws/stream/cam_local_01`
        : `ws://localhost:8000/ws/stream/${camId}?url=${encodeURIComponent(streamUrl)}`;

      ws = new WebSocket(wsUrl);
      ws.binaryType = 'blob';

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onerror = () => setIsConnected(false);
      
      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const telemetry = JSON.parse(event.data);
            if (telemetry.detections) {
              setDetections(telemetry.detections);
            }
            if (telemetry.frame_size) {
              setFrameSize(telemetry.frame_size);
            }
          } catch (e) {
            console.error("Telemetry parse error", e);
          }
        } else {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          objectUrl = URL.createObjectURL(event.data);
          if (frameRef.current) {
            frameRef.current.src = objectUrl;
          }
        }
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [camId, type, streamUrl]);

  const [fW, fH] = frameSize;

  // Real-time Multi-Point Breach Detection with 10-Second Visual Persistence
  useEffect(() => {
    if (points.length >= 3 && detections.length > 0 && !isEditing) {
      let currentFrameBreach = false;
      
      for (let det of detections) {
        const [x1, y1, x2, y2] = det.bbox;
        const checkPoints = [
          [(((x1 + x2) / 2) / fW) * 100, (y2 / fH) * 100],                         
          [(((x1 + x2) / 2) / fW) * 100, (((y1 + y2) / 2) / fH) * 100],             
          [(((x1 + x2) / 2) / fW) * 100, (y1 / fH) * 100]                          
        ];
        
        if (checkPoints.some(pt => isPointInPolygon(pt, points))) {
          currentFrameBreach = true;
          break;
        }
      }

      if (currentFrameBreach) {
        setIsBreached(true);
        
        // Clear the existing timer if the person is still in the zone
        if (breachTimeoutRef.current) {
          clearTimeout(breachTimeoutRef.current);
        }
        
        // Keep the visual alarm active for 10 seconds after the person leaves
        breachTimeoutRef.current = setTimeout(() => {
          setIsBreached(false);
        }, 10000);
      }
    }
  }, [detections, points, isEditing, fW, fH]);

  // Clean up the timer if the component unmounts
  useEffect(() => {
    return () => {
      if (breachTimeoutRef.current) clearTimeout(breachTimeoutRef.current);
    };
  }, []);

  // Unified Alert System: Voice Announcement, Toast, & Database Sync
  useEffect(() => {
    if (isBreached && detections.length > 0) {
      const now = Date.now();
      if (now - lastBreachTime.current > 10000) {
        lastBreachTime.current = now;
        
        const primaryTarget = detections[0];
        
        speakAlert(name);

        toast.error(`BREACH DETECTED: ${name}`, {
          style: { borderRadius: '8px', background: '#111827', color: '#fff', border: '1px solid #ef4444' },
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        });

        fetch('http://localhost:5000/api/logs/breach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cameraId: camId,
            cameraName: name,
            identity: primaryTarget.label ? primaryTarget.label.toUpperCase() : 'TARGET INTRUDER',
            confidence: Math.round(primaryTarget.confidence * 100),
            behavior: `Perimeter violation verified in sector ${name}. Tracking ID engaged at ${new Date().toLocaleTimeString()}.`
          })
        }).catch(err => console.error("DB Log Sync Failed:", err));
      }
    }
  }, [isBreached, detections, camId, name]);

  const toggleEditor = () => {
    if (isEditing) {
      if (points.length >= 3) {
        setZoneActive(true);
      } else {
        setZoneActive(false);
        setPoints([]); 
      }
    }
    setIsEditing(!isEditing);
  };

  const handleClearZone = (e) => {
    e.stopPropagation(); 
    setPoints([]);
    setZoneActive(false);
    setIsBreached(false);
    if (breachTimeoutRef.current) clearTimeout(breachTimeoutRef.current); // Stop alarm if cleared manually
    localStorage.removeItem(`sentinel_zone_${camId}`);
  };

  return (
    <NodeWrapper $isEditing={isEditing} $zoneActive={zoneActive}$isBreached={isBreached}>
      <div className="cam-header">
        <span className="cam-title">{name}</span>
        <div className="status-indicators">
          <span className={`badge ${isConnected ? 'tech' : 'standby'}`}>
            {isConnected ? 'LIVE FEED' : 'STANDBY'}
          </span>
          <span className={`badge ${isBreached ? 'breach' : points.length >= 3 ? 'danger' : 'safe'}`}>
            {isBreached ? '⚠ THREAT DETECTED' : points.length >= 3 ? 'ZONE ARMED' : 'UNARMED'}
          </span>
        </div>
      </div>

      <div className="feed-container" ref={containerRef}>
        {isConnected ? (
          <img ref={frameRef} alt="Live Stream" className="live-video" />
        ) : (
          <div className="standby-screen">
            <p className="standby-title">CHANNEL READY</p>
            <p className="standby-desc">Awaiting Stream URL in Hardware Matrix</p>
          </div>
        )}

        {isConnected && !isEditing && detections.map((det, i) => {
          const [x1, y1, x2, y2] = det.bbox;
          return (
            <div 
              key={i} 
              className="bounding-box" 
              style={{
                left: `${(x1 / fW) * 100}%`,
                top: `${(y1 / fH) * 100}%`,
                width: `${((x2 - x1) / fW) * 100}%`,
                height: `${((y2 - y1) / fH) * 100}%`
              }}
            >
              <span className="conf-tag">{det.label || 'ID'} {Math.round(det.confidence * 100)}%</span>
            </div>
          );
        })}

        <ZoneEditor 
          zonePoints={points}
          setZonePoints={setPoints}
          hasBreach={isBreached}
          isDrawing={isEditing}
          setIsDrawing={setIsEditing}
        />

        {isEditing && (
          <button className="clear-btn" onClick={handleClearZone}>
            Clear Zone
          </button>
        )}

        {isBreached && <div className="breach-flash" />}

        <ZoneEditButton onClick={toggleEditor} isEditing={isEditing} />
      </div>
    </NodeWrapper>
  );
};

const NodeWrapper = styled.div`
  background: #111827;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid ${props => props.$isBreached ? '#ef4444' : props.$isEditing ? '#00FFFF' : 'rgba(255, 255, 255, 0.08)'};
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.$isBreached ? '0 0 30px rgba(239, 68, 68, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.4)'};
  transition: all 0.3s ease;

  .cam-header {
    display: flex; justify-content: space-between; align-items: center; padding: 10px 16px;
    background: ${props => props.$isBreached ? '#7f1d1d' : '#1a202c'};
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .cam-title { color: #e2e8f0; font-weight: 600; font-family: 'Courier New', monospace; font-size: 0.85rem; }
  .status-indicators { display: flex; gap: 8px; }
  .badge { font-size: 0.65rem; padding: 3px 8px; border-radius: 4px; font-weight: 700; letter-spacing: 1px; }
  .tech { background: rgba(0, 255, 255, 0.15); color: #00FFFF; border: 1px solid rgba(0, 255, 255, 0.3); }
  .standby { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }
  .safe { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
  .danger { background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3); }
  .breach { background: rgba(239, 68, 68, 0.3); color: #ffffff; border: 1px solid #ef4444; animation: flash 0.5s infinite; }

  @keyframes flash {
    0%, 100% { background: rgba(239, 68, 68, 0.8); }
    50% { background: rgba(239, 68, 68, 0.2); }
  }

  .feed-container { position: relative; width: 100%; aspect-ratio: 16 / 9; background: #030712; overflow: hidden; }
  .live-video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .standby-screen { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #475569; }
  .standby-title { font-size: 0.85rem; font-weight: 700; letter-spacing: 2px; color: #64748b; margin: 0; }
  .standby-desc { font-size: 0.75rem; color: #475569; margin: 4px 0 0; }

  .bounding-box {
    position: absolute; border: 2px solid #00FFFF; box-shadow: 0 0 10px rgba(0, 255, 255, 0.5); pointer-events: none; z-index: 12;
  }
  .conf-tag {
    position: absolute; top: -20px; left: -2px; background: #00FFFF; color: #000; font-size: 0.65rem; font-weight: 700; padding: 1px 5px; font-family: 'Courier New', monospace;
  }
  .breach-flash {
    position: absolute; inset: 0; background: rgba(239, 68, 68, 0.25); pointer-events: none; z-index: 20; animation: flash 0.5s infinite;
  }
  .clear-btn {
    position: absolute; top: 14px; right: 14px; background: rgba(15, 23, 42, 0.9); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.15); padding: 5px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; cursor: pointer; z-index: 25;
    &:hover { color: #fff; border-color: #ef4444; }
  }
`;

export default CameraNode;