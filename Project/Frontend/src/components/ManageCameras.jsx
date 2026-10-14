import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Shield, Activity, Fingerprint, Crosshair, AlertTriangle } from 'lucide-react';

// ==========================================
// 1. SEPARATE COMPONENT: LIVE DIAGNOSTICS PANEL
// Displays real-time objects, persons, and breach data
// ==========================================
const DiagnosticPanel = ({ detections, recentBreach }) => {
  // YOLOv8 class 0 is 'person'. Filter if you want strictly persons.
  const activeTargets = detections.length;
  
  return (
    <DiagnosticsWrapper>
      <div className="diag-box">
        <div className="diag-header">
          <Crosshair size={14} color="#3b82f6" />
          <span className="diag-label">LIVE TARGETS</span>
        </div>
        <span className="diag-value">{activeTargets > 0 ? activeTargets : 'NONE'}</span>
        {activeTargets > 0 && (
          <div className="target-tags">
            {detections.slice(0, 2).map((det, i) => (
              <span key={i} className="mini-tag">{det.label || 'ID'} {Math.round(det.confidence * 100)}%</span>
            ))}
            {activeTargets > 2 && <span className="mini-tag">+{activeTargets - 2} more</span>}
          </div>
        )}
      </div>

      <div className="diag-box">
        <div className="diag-header">
          <AlertTriangle size={14} color={recentBreach ? "#ef4444" : "#10b981"} />
          <span className="diag-label">LATEST BREACH</span>
        </div>
        <span className={`diag-value ${recentBreach ? 'alert' : 'safe'}`}>
          {recentBreach ? new Date(recentBreach.timestamp).toLocaleTimeString() : 'SECURE'}
        </span>
        {recentBreach && (
          <span className="breach-identity">
            <Fingerprint size={12} /> {recentBreach.identity}
          </span>
        )}
      </div>
    </DiagnosticsWrapper>
  );
};

// ==========================================
// 2. SEPARATE COMPONENT: CAMERA CONFIG NODE
// Handles individual WebSocket AI connection and rendering
// ==========================================
const CameraConfigNode = ({ node, url, onEdit, onRemove }) => {
  const [status, setStatus] = useState(node.isLocal || url ? 'connecting' : 'empty');
  const [imageSrc, setImageSrc] = useState(null);
  const [detections, setDetections] = useState([]);
  const [frameSize, setFrameSize] = useState([640, 480]);
  const [recentBreach, setRecentBreach] = useState(null);

  // Connect to Real-Time AI Engine for verification
  useEffect(() => {
    if (!node.isLocal && (!url || url === '')) {
      setStatus('empty');
      return;
    }

    setStatus('connecting');
    const wsUrl = node.isLocal
      ? `ws://localhost:8000/ws/stream/${node.id}`
      : `ws://localhost:8000/ws/stream/${node.id}?url=${encodeURIComponent(url)}`;

    let ws = new WebSocket(wsUrl);
    ws.binaryType = 'blob';

    ws.onopen = () => setStatus('active');
    ws.onclose = () => setStatus('error');
    ws.onerror = () => setStatus('error');

    let objectUrl = null;

    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(event.data);
        setImageSrc(objectUrl);
      } else {
        try {
          const telemetry = JSON.parse(event.data);
          if (telemetry.detections) setDetections(telemetry.detections);
          if (telemetry.frame_size) setFrameSize(telemetry.frame_size);
        } catch (e) {}
      }
    };

    return () => {
      ws.close();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, node.isLocal, node.id]);

  // Fetch Latest DB Breach Log for this specific camera
  useEffect(() => {
    const fetchBreach = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/logs');
        const json = await res.json();
        if (json.success && json.data) {
          const nodeBreaches = json.data.filter(b => b.cameraId === node.id);
          if (nodeBreaches.length > 0) {
            setRecentBreach(nodeBreaches[0]); // Most recent first from backend
          }
        }
      } catch (err) {}
    };
    
    fetchBreach();
    const interval = setInterval(fetchBreach, 5000);
    return () => clearInterval(interval);
  }, [node.id]);

  const [fW, fH] = frameSize;

  return (
    <div className={`camera-card ${status}`}>
      <div className="card-header">
        <div className="header-info">
          <h2>{node.name}</h2>
          <p className="subtitle">{node.isLocal ? 'Hardware Accelerated WebCam' : (url || 'No URL Configured')}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      
      <div className="preview-container">
        {imageSrc && status === 'active' ? (
          <>
            <img src={imageSrc} alt={`Stream ${node.name}`} className="live-video" />
            
            {/* Draw Scaled Bounding Boxes to verify AI tracks correctly */}
            {detections.map((det, i) => {
              const [x1, y1, x2, y2] = det.bbox;
              return (
                <div 
                  key={i} 
                  className="bounding-box" 
                  style={{
                    left: `${(x1 / fW) * 100}%`, top: `${(y1 / fH) * 100}%`,
                    width: `${((x2 - x1) / fW) * 100}%`, height: `${((y2 - y1) / fH) * 100}%`
                  }}
                >
                  <span className="conf-tag">{det.label}</span>
                </div>
              );
            })}
          </>
        ) : (
          <div className={`overlay-state ${status}`}>
            {status === 'connecting' && <><SpinnerIcon /><span>Connecting to Engine...</span></>}
            {status === 'error' && <><OfflineIcon /><span>Connection Failed</span></>}
            {status === 'empty' && <><OfflineIcon /><span>Standby</span></>}
          </div>
        )}
      </div>

      {/* NEW COMPONENT INTEGRATION */}
      <DiagnosticPanel detections={detections} recentBreach={recentBreach} />

      <div className="card-footer">
        <button 
          className={`btn ${node.isLocal ? 'secondary disabled' : 'primary'}`} 
          onClick={node.isLocal ? undefined : () => onEdit(node.id)}
          disabled={node.isLocal}
        >
          {node.isLocal ? 'System Locked' : (url ? 'Edit URL' : 'Configure IP')}
        </button>
        {!node.isLocal && url && (
          <button className="btn danger-text" onClick={() => onRemove(node.id)}>Remove</button>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================
const ManageCameras = () => {
  const navigate = useNavigate();
  
  const [cameras, setCameras] = useState({
    cam_ip_02: '', cam_ip_03: '', cam_ip_04: ''
  });
  
  const [activeModal, setActiveModal] = useState(null);
  const [tempUrl, setTempUrl] = useState('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('sentinel_cam_config');
    if (savedConfig) {
      setCameras(JSON.parse(savedConfig));
    }
  }, []);

  const openModal = (camId) => {
    setTempUrl(cameras[camId] || '');
    setActiveModal(camId);
  };

  const closeModal = () => {
    setActiveModal(null);
    setTempUrl('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    const newConfig = { ...cameras, [activeModal]: tempUrl };
    setCameras(newConfig);
    localStorage.setItem('sentinel_cam_config', JSON.stringify(newConfig));
    closeModal();
  };

  const handleRemove = (camId) => {
    const newConfig = { ...cameras, [camId]: '' };
    setCameras(newConfig);
    localStorage.setItem('sentinel_cam_config', JSON.stringify(newConfig));
  };

  const allNodes = [
    { id: 'cam_local_01', name: 'Node 01: Local Engine', isLocal: true },
    { id: 'cam_ip_02', name: 'Node 02: Perimeter North', isLocal: false },
    { id: 'cam_ip_03', name: 'Node 03: Server Room', isLocal: false },
    { id: 'cam_ip_04', name: 'Node 04: Parking Sector', isLocal: false }
  ];

  return (
    <Container>
      <header className="top-nav">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Command Center
        </button>
        <h1 className="page-title">Hardware Matrix Configuration</h1>
      </header>

      <main className="content-grid">
        {allNodes.map(node => (
          <CameraConfigNode 
            key={node.id} 
            node={node} 
            url={cameras[node.id]} 
            onEdit={openModal} 
            onRemove={handleRemove} 
          />
        ))}
      </main>

      {/* IP Configuration Modal */}
      {activeModal && (
        <ModalBackdrop onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Configure IP Stream</h3>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <label>Network Video URL</label>
              <input 
                type="url" required autoFocus
                value={tempUrl} 
                onChange={(e) => setTempUrl(e.target.value)} 
                placeholder="http://192.168.1.5:8080/video" 
              />
              <p className="help-text">Enter a valid local IP camera or MJPEG stream URL to bind to AI tracker.</p>
              
              <div className="modal-footer">
                <button type="button" className="btn secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn primary">Bind Feed</button>
              </div>
            </form>
          </div>
        </ModalBackdrop>
      )}
    </Container>
  );
};

// ==========================================
// UTILS & STYLED COMPONENTS
// ==========================================
const StatusBadge = ({ status }) => {
  const configs = {
    active: { text: 'AI Active', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    error: { text: 'Engine Offline', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    connecting: { text: 'Handshake...', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
    empty: { text: 'Unconfigured', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' }
  };
  const current = configs[status];
  
  return (
    <span style={{ 
      color: current.color, backgroundColor: current.bg, padding: '4px 10px', 
      borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1px',
      display: 'flex', alignItems: 'center', gap: '6px'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: current.color }} />
      {current.text}
    </span>
  );
};

const SpinnerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: '28px', animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const OfflineIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px' }}>
    <path d="M2 2l20 20M10.71 5.71A2 2 0 0 1 12 5h8a2 2 0 0 1 2 2v10a2 2 0 0 1-.59 1.41M12 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1.58"/>
  </svg>
);

const DiagnosticsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px 20px;
  background: #0f172a;
  border-top: 1px solid #1e293b;

  .diag-box {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .diag-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .diag-label {
    font-size: 0.65rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 1px;
  }

  .diag-value {
    font-size: 1.2rem;
    font-weight: 700;
    color: #f8fafc;
    font-family: 'Courier New', Courier, monospace;
    line-height: 1;
  }

  .diag-value.alert { color: #ef4444; }
  .diag-value.safe { color: #10b981; font-size: 1rem; }

  .breach-identity {
    font-size: 0.7rem;
    color: #ef4444;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    font-family: monospace;
  }

  .target-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }

  .mini-tag {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.3);
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-family: monospace;
  }
`;

const Container = styled.div`
  min-height: 100vh;
  background-color: #030712;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  
  .top-nav {
    display: flex; align-items: center; gap: 24px; padding: 20px 40px; background: #0f172a; border-bottom: 1px solid #1e293b;
  }
  .back-button {
    display: flex; align-items: center; gap: 8px; background: none; border: none; color: #94a3b8; font-size: 0.85rem; font-weight: 700; letter-spacing: 1px; cursor: pointer; transition: color 0.2s;
    &:hover { color: #38bdf8; }
    svg { width: 16px; }
  }
  .page-title { font-size: 1.15rem; font-weight: 600; margin: 0; color: #f8fafc; border-left: 2px solid #334155; padding-left: 20px; letter-spacing: 1.5px; }

  .content-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 24px; padding: 40px; max-width: 1600px; margin: 0 auto;
  }

  .camera-card {
    background: #0f172a; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden; display: flex; flex-direction: column; transition: border-color 0.2s;
    &.active { border-color: #3b82f6; }
    &.error { border-color: #ef4444; }
  }

  .card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #1e293b; background: #111827; }
  .header-info h2 { font-size: 0.95rem; font-weight: 600; margin: 0 0 4px 0; }
  .subtitle { font-size: 0.75rem; color: #64748b; margin: 0; font-family: monospace; }

  .preview-container { aspect-ratio: 16/9; background: #020617; position: relative; overflow: hidden; }
  .live-video { width: 100%; height: 100%; object-fit: cover; }

  .bounding-box { position: absolute; border: 2px solid #00FFFF; box-shadow: 0 0 10px rgba(0, 255, 255, 0.5); pointer-events: none; z-index: 12; }
  .conf-tag { position: absolute; top: -20px; left: -2px; background: #00FFFF; color: #000; font-size: 0.65rem; font-weight: 800; padding: 1px 6px; border-radius: 2px; font-family: monospace; }

  .overlay-state {
    position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #475569; font-size: 0.85rem; font-weight: 600; letter-spacing: 1px;
    &.error { color: #ef4444; }
    &.connecting { color: #eab308; }
  }

  .card-footer { padding: 12px 20px; display: flex; gap: 12px; background: #111827; border-top: 1px solid #1e293b; }
  .btn {
    padding: 8px 16px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; letter-spacing: 0.5px;
    &.primary { background: #0284c7; color: white; &:hover { background: #0369a1; } }
    &.secondary { background: transparent; border-color: #334155; color: #94a3b8; &:hover:not(.disabled) { background: #1e293b; color: #f8fafc; } }
    &.danger-text { background: transparent; color: #ef4444; margin-left: auto; &:hover { color: #dc2626; border-color: #ef4444; } }
    &.disabled { opacity: 0.5; cursor: not-allowed; }
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`;

const ModalBackdrop = styled.div`
  position: fixed; inset: 0; background: rgba(3, 7, 18, 0.85); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px;
  .modal-box { background: #0f172a; border-radius: 12px; width: 100%; max-width: 480px; border: 1px solid #1e293b; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
  .modal-top { padding: 20px 24px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
  .modal-top h3 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #f8fafc; letter-spacing: 1px; }
  .close-btn { background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; &:hover { color: #f8fafc; } }
  .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 8px; }
  .modal-body label { font-size: 0.8rem; font-weight: 700; color: #94a3b8; letter-spacing: 1px; }
  .modal-body input { background: #020617; border: 1px solid #334155; padding: 12px 14px; border-radius: 6px; color: #f8fafc; font-size: 0.95rem; font-family: monospace; &:focus { outline: none; border-color: #3b82f6; } }
  .help-text { font-size: 0.75rem; color: #475569; margin: 0 0 16px 0; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
`;

export default ManageCameras;