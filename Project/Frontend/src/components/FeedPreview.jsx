import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import CameraNode from './CameraNode';
import { Shield, Activity, Terminal, AlertTriangle, ArrowLeft, Fingerprint, Clock, Crosshair } from 'lucide-react';

const FeedPreview = () => {
  const navigate = useNavigate();
  
  // Load saved camera IPs from localStorage
  const [cameras, setCameras] = useState({
    cam_ip_02: '',
    cam_ip_03: '',
    cam_ip_04: ''
  });
  
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    const savedConfig = localStorage.getItem('sentinel_cam_config');
    if (savedConfig) {
      setCameras(JSON.parse(savedConfig));
    }
  }, []);

  // Fetch live logs strictly for the telemetry side-panel
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/logs');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Keep only the latest 15 logs for the side panel
          setRecentLogs(json.data.slice(0, 15));
        }
      } catch (err) {
        console.error("Telemetry fetch failed:", err);
      }
    };
    
    fetchLogs();
    const interval = setInterval(fetchLogs, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardContainer>
      {/* PREMIUM TOP HEADER */}
      <Header>
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} /> COMMAND CENTER
          </button>
          <div className="divider"></div>
          <div className="title-wrapper">
            <h1 className="main-title">SURVEILLANCE FEED MATRIX</h1>
            <p className="sub-title">Live Node Operations & Intrusion Detection</p>
          </div>
        </div>
        <div className="header-right">
          <div className="status-badge">
            <Activity size={16} className="pulse-icon" />
            <span>AI NEURAL ENGINE ONLINE</span>
          </div>
          <button className="manage-btn" onClick={() => navigate('/manage-cameras')}>
            <Shield size={16} /> Manage Hardware
          </button>
        </div>
      </Header>

      <MainContent>
        {/* LEFT COMPONENT: VIDEO FEED MATRIX */}
        <MatrixSection>
          <div className="camera-grid">
            <CameraNode 
              camId="cam_local_01" 
              name="NODE 01: MAIN WEBCAM" 
              type="WEBCAM" 
            />
            <CameraNode 
              camId="cam_ip_02" 
              name="NODE 02: PERIMETER NORTH" 
              type="IP" 
              streamUrl={cameras.cam_ip_02} 
            />
            <CameraNode 
              camId="cam_ip_03" 
              name="NODE 03: SERVER ROOM" 
              type="IP" 
              streamUrl={cameras.cam_ip_03} 
            />
            <CameraNode 
              camId="cam_ip_04" 
              name="NODE 04: PARKING SECTOR" 
              type="IP" 
              streamUrl={cameras.cam_ip_04} 
            />
          </div>
        </MatrixSection>

        {/* RIGHT COMPONENT: ISOLATED LIVE THREAT LOGS */}
        <TelemetrySidebar>
          <div className="telemetry-header">
            <div className="t-title">
              <Terminal size={18} color="#3b82f6" /> 
              LIVE THREAT LOGS
            </div>
            <div className="t-status">
              <span className="dot"></span> SYNCING
            </div>
          </div>

          <div className="telemetry-body">
            {recentLogs.length === 0 ? (
              <div className="empty-logs">
                <Shield size={40} color="#334155" />
                <p>System Secure. No breaches recorded.</p>
              </div>
            ) : (
              recentLogs.map((log, index) => (
                <div key={log._id || index} className={`log-card ${log.confidence >= 80 ? 'critical' : 'warning'}`}>
                  <div className="log-top">
                    <span className="sector"><Crosshair size={12} /> {log.cameraName}</span>
                    <span className="time"><Clock size={12} /> {new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="log-mid">
                    <AlertTriangle size={16} className="alert-icon" />
                    <span className="target-id"><Fingerprint size={14}/> {log.identity}</span>
                    <span className="confidence">{log.confidence}% MATCH</span>
                  </div>
                  <div className="log-bot">
                    {log.behavior}
                  </div>
                </div>
              ))
            )}
          </div>
        </TelemetrySidebar>
      </MainContent>
    </DashboardContainer>
  );
};

// --- ANIMATIONS ---
const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0.6; transform: scale(1); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
`;

// --- STYLED COMPONENTS ---
const DashboardContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #030712;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: #0B0F19;
  border-bottom: 1px solid #1e293b;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 10;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 1px;
    cursor: pointer;
    transition: color 0.2s;
    &:hover { color: #3b82f6; }
  }

  .divider {
    width: 2px;
    height: 30px;
    background: #1e293b;
  }

  .title-wrapper {
    display: flex;
    flex-direction: column;
  }

  .main-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #f8fafc;
  }

  .sub-title {
    margin: 2px 0 0 0;
    font-size: 0.75rem;
    color: #64748b;
    font-family: monospace;
    letter-spacing: 0.5px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    padding: 6px 14px;
    border-radius: 20px;
    color: #10b981;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 1px;

    .pulse-icon {
      animation: ${pulse} 2s infinite ease-in-out;
    }
  }

  .manage-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #2563eb;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #1d4ed8; }
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 24px;
  overflow: hidden;
`;

const MatrixSection = styled.section`
  flex: 3;
  overflow-y: auto;
  padding-right: 8px;

  /* Premium Scrollbar */
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: #0B0F19; border-radius: 4px; }
  &::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: #334155; }

  .camera-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 24px;
  }
`;

const TelemetrySidebar = styled.aside`
  flex: 1;
  min-width: 350px;
  max-width: 450px;
  background: #0B0F19;
  border: 1px solid #1e293b;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);

  .telemetry-header {
    background: #111827;
    padding: 16px 20px;
    border-bottom: 1px solid #1e293b;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .t-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.85rem;
    font-weight: 800;
    color: #e2e8f0;
    letter-spacing: 1px;
  }

  .t-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #10b981;
    font-family: monospace;

    .dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      animation: ${pulse} 1.5s infinite;
    }
  }

  .telemetry-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    /* Premium Scrollbar */
    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
  }

  .empty-logs {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #475569;
    font-size: 0.85rem;
    text-align: center;
    gap: 12px;
  }

  .log-card {
    background: #111520;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: ${slideIn} 0.3s ease-out forwards;
    transition: transform 0.2s;

    &:hover { transform: translateX(-4px); }

    &.critical {
      border-left: 3px solid #ef4444;
      background: linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, rgba(17, 21, 32, 1) 100%);
      .alert-icon { color: #ef4444; }
    }

    &.warning {
      border-left: 3px solid #eab308;
      background: linear-gradient(90deg, rgba(234, 179, 8, 0.05) 0%, rgba(17, 21, 32, 1) 100%);
      .alert-icon { color: #eab308; }
    }
  }

  .log-top {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: #94a3b8;
    font-weight: 600;
    letter-spacing: 0.5px;
    font-family: monospace;

    .sector, .time {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .log-mid {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .target-id {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 1rem;
    font-weight: 700;
    color: #f8fafc;
    font-family: monospace;
  }

  .confidence {
    background: #1e293b;
    color: #e2e8f0;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 800;
  }

  .log-bot {
    font-size: 0.75rem;
    color: #cbd5e1;
    line-height: 1.4;
    padding-top: 8px;
    border-top: 1px solid #1e293b;
  }
`;

export default FeedPreview;