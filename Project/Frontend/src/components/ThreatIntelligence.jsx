import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { 
  Shield, LayoutGrid, Crosshair, Settings, Bell, Search, 
  Activity, Clock, ChevronRight, Fingerprint, AlertTriangle, ArrowLeft, Terminal
} from 'lucide-react';

const ThreatIntelligence = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, text: '[SYSTEM] Initializing YOLOv8 + ByteTrack neural engine...', type: 'info' },
    { id: 2, text: '[NET] Connected to MongoDB surveillance cluster at localhost:27017', type: 'success' },
    { id: 3, text: '[RADAR] Zone breach geometry loaded. Polling interval set to 1000ms.', type: 'info' }
  ]);
  const [stats, setStats] = useState({ total: 0, highRisk: 0, latestNode: 'SECURE' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');

  // Refs to prevent state flooding and handle terminal scrolling
  const lastProcessedLogId = useRef(null);
  const terminalEndRef = useRef(null);

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const fetchLogs = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('http://localhost:5000/api/logs');
      const json = await res.json();
      
      // Validate that the response contains a data array before processing
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
        const highRiskCount = json.data.filter(log => log.confidence >= 80).length;
        
        setStats({
          total: json.data.length,
          highRisk: highRiskCount,
          latestNode: json.data.length > 0 ? json.data[0].cameraName : 'SECURE'
        });
        
        setLastUpdated('Just now');

        // Dynamically feed terminal ONLY if it is a new breach event
        if (json.data.length > 0) {
          const latest = json.data[0];
          
          if (latest._id !== lastProcessedLogId.current) {
            lastProcessedLogId.current = latest._id;
            
            const newTerminalEntry = {
              id: Date.now(),
              text: `[BREACH DETECTED] Sector: ${latest.cameraName} | Target: ${latest.identity} | Confidence: ${latest.confidence}%`,
              type: 'alert'
            };
            setTerminalLogs(prev => [...prev.slice(-14), newTerminalEntry]);
          }
        }
      }
    } catch (err) {
      console.error("Database Sync Error:", err);
      // Fallback state on error to prevent crashes
      setLastUpdated('Sync Failed');
    } finally {
      setTimeout(() => setIsSyncing(false), 300);
    }
  };

  useEffect(() => {
    fetchLogs(); // Initial fetch
    const interval = setInterval(fetchLogs, 1000); // 1-second DB polling
    
    const timeInterval = setInterval(() => {
      setLastUpdated(prev => {
        if (prev === 'Just now') return '1s ago';
        if (prev === 'Sync Failed') return prev;
        if (prev.includes('s ago')) return `${parseInt(prev) + 1}s ago`;
        return prev;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const latestThreat = logs.length > 0 ? logs[0] : null;

  return (
    <AppLayout>
      {/* SIDEBAR */}
      <Sidebar>
        <div className="sidebar-header" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <Shield size={20} color="#3b82f6" />
          </div>
          <div className="logo-text">
            <h2>Threat</h2>
            <p>Intelligence</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavItem className="active"><LayoutGrid size={18} /> Overview <ChevronRight size={14} className="arrow" /></NavItem>
          <NavItem onClick={() => navigate('/preview')}><Crosshair size={18} /> Live Matrix</NavItem>
          <NavItem onClick={() => navigate('/manage-cameras')}><Settings size={18} /> Hardware</NavItem>
        </nav>

        <div className="sidebar-footer">
          <div className="sync-card">
            <div className="sync-top">
              <span className={`pulse-dot ${lastUpdated === 'Sync Failed' ? 'red' : 'green'}`}></span>
              Live DB Sync
            </div>
            <p className="sync-time">Last updated: {lastUpdated}</p>
            <ChevronRight size={14} />
          </div>
        </div>
      </Sidebar>

      {/* MAIN CONTENT AREA */}
      <MainArea>
        
        {/* TOP BAR */}
        <TopBar>
          <div className="top-left-actions">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={16} /> Dashboard
            </button>
            <div className="search-bar">
              <Search size={18} color="#6b7280" />
              <input type="text" placeholder="Search unique IDs, tracking tags, or sectors..." />
            </div>
          </div>

          <div className="top-right">
            <button className="icon-btn"><Bell size={18} /></button>
            <div className="user-profile">
              <div className="avatar">A</div>
              <div className="user-info">
                <span className="name">Admin</span>
                <span className="role">Security Analyst</span>
              </div>
            </div>
          </div>
        </TopBar>

        <ContentWrapper>
          
          {/* PAGE HEADER */}
          <PageHeader>
            <div className="titles">
              <h1>THREAT INTELLIGENCE & TELEMETRY</h1>
              <p>Real-Time Multi-Person Tracking, Unique ID Allocation & Breach Logs</p>
            </div>
            <div className="live-badge">
              <span className={`pulse-dot ${isSyncing ? 'syncing' : ''}`}></span>
              Live Pipeline Active
              <Activity size={16} className={isSyncing ? 'pulse-anim' : ''} />
            </div>
          </PageHeader>

          {/* STATS GRID */}
          <StatsGrid>
            <StatCard className="red-glow">
              <div className="icon-box red"><Shield size={24} /></div>
              <div className="stat-info">
                <h3>TOTAL BREACHES</h3>
                <div className="value-row">
                  <span className="value">{stats.total}</span>
                  <ChevronRight size={16} />
                </div>
                <p className="subtitle">{stats.total === 0 ? 'No active breaches' : `${stats.total} recorded events`}</p>
              </div>
            </StatCard>

            <StatCard className="blue-glow">
              <div className="icon-box blue"><Crosshair size={24} /></div>
              <div className="stat-info">
                <h3>UNIQUE TARGET IDs</h3>
                <div className="value-row">
                  <span className="value">{stats.highRisk}</span>
                  <ChevronRight size={16} />
                </div>
                <p className="subtitle">Tracked via ByteTrack neural array</p>
              </div>
            </StatCard>

            <StatCard className="green-glow">
              <div className="icon-box green"><Activity size={24} /></div>
              <div className="stat-info">
                <h3>LAST ACTIVE SECTOR</h3>
                <div className="value-row">
                  <span className="value text-status">{stats.latestNode}</span>
                  <ChevronRight size={16} />
                </div>
                <p className="subtitle">Zero latency transmission</p>
              </div>
            </StatCard>
          </StatsGrid>

          {/* DATA PANELS */}
          <DataPanels>
            
            {/* EVENT MATRIX */}
            <MatrixPanel>
              <div className="panel-top">
                <div className="panel-title">
                  <Clock size={18} /> ASSIGNED ID MATRIX & LOGS
                </div>
                <div className="time-filters">
                  <button className="active">Real-Time</button>
                  <button>Buffered</button>
                </div>
              </div>

              <div className="table-container">
                {logs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><Shield size={32} /></div>
                    <h3>No tracking events recorded</h3>
                    <p>Assigned person IDs and breach logs will stream here instantly.</p>
                  </div>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <th>TIMESTAMP</th>
                        <th>NODE SECTOR</th>
                        <th>ASSIGNED ID & TAG</th>
                        <th>CONFIDENCE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => (
                        <tr key={log._id || index} className={index === 0 ? 'new-entry' : ''}>
                          <td className="mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="node-name">{log.cameraName}</td>
                          <td className="identity"><Fingerprint size={14}/> {log.identity}</td>
                          <td>
                            <div className="confidence-bar">
                              <div className="fill" style={{ width: `${log.confidence}%`, background: log.confidence >= 80 ? '#ef4444' : '#3b82f6' }}></div>
                              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', marginLeft: '8px' }}>{log.confidence}%</span>
                            </div>
                          </td>
                          <td><span className="badge">TRACKED</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </MatrixPanel>

            {/* ACTIVE THREAT PROFILE */}
            <ProfilePanel className={latestThreat ? 'active-threat' : ''}>
              <div className="panel-top">
                <div className="panel-title alert">
                  <AlertTriangle size={18} /> ACTIVE TARGET PROFILE
                </div>
                <ChevronRight size={16} color="#6b7280" />
              </div>

              <div className="profile-content">
                {latestThreat ? (
                  <div className="threat-data">
                    <div className="target-wireframe">
                      <div className="scanner-line"></div>
                      <Crosshair size={56} color="#ef4444" opacity={0.6} />
                      <span className="glow-text">ID LOCKED & TRACKING</span>
                    </div>
                    
                    <div className="intel-row">
                      <div className="intel-block">
                        <label>TARGET IDENTIFIER</label>
                        <p className="mono high-alert">{latestThreat.identity}</p>
                      </div>
                      <div className="intel-block">
                        <label>ACCURACY</label>
                        <p className="mono">{latestThreat.confidence}%</p>
                      </div>
                    </div>

                    <div className="intel-block full">
                      <label>BEHAVIORAL VECTOR</label>
                      <div className="behavior-box">
                        <p>{latestThreat.behavior}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-profile">
                    <div className="glowing-shield">
                      <Shield size={40} color="#ef4444" />
                      <div className="ripple"></div>
                    </div>
                    <h3>SYSTEM SECURE</h3>
                    <p>Awaiting target entry into active zone.</p>
                  </div>
                )}
              </div>
            </ProfilePanel>

          </DataPanels>

          {/* LIVE TERMINAL LOGS OUTPUT */}
          <TerminalPanel>
            <div className="terminal-header">
              <div className="t-left"><Terminal size={16} /> LIVE INFERENCE & TELEMETRY STREAM</div>
              <div className="t-status"><span className="dot"></span> 30 FPS STREAM</div>
            </div>
            <div className="terminal-body">
              {terminalLogs.map(t => (
                <div key={t.id} className={`terminal-line ${t.type}`}>
                  <span className="t-time">[{new Date(t.id > 3 ? t.id : Date.now()).toLocaleTimeString()}]</span> {t.text}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </TerminalPanel>

        </ContentWrapper>
      </MainArea>
    </AppLayout>
  );
};

// --- ANIMATIONS ---
const pulseSync = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
`;

const rippleEffect = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
`;

const scan = keyframes`
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
`;

const flashRow = keyframes`
  0% { background-color: rgba(239, 68, 68, 0.2); }
  100% { background-color: transparent; }
`;

// --- STYLED COMPONENTS ---
const AppLayout = styled.div`
  display: flex; height: 100vh; background-color: #0B0F19; color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden;
`;

const Sidebar = styled.aside`
  width: 260px; background-color: #111520; border-right: 1px solid #1f2937; display: flex; flex-direction: column; padding: 24px 16px;
  .sidebar-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 40px; padding: 0 8px;
    .logo-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.3); }
    .logo-text h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #fff; line-height: 1.2; }
    .logo-text p { margin: 0; font-size: 1.1rem; color: #9ca3af00; line-height: 1.2; font-weight: 300; }
  }
  .sidebar-nav { display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .sidebar-footer { margin-top: auto; .sync-card { background: #151b2b; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 4px; position: relative; cursor: pointer; &:hover { background: #1a2235; } .sync-top { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; color: #10b981; } .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: ${pulseSync} 2s infinite; } .pulse-dot.red { background: #ef4444; animation: none; } .sync-time { margin: 0; font-size: 0.75rem; color: #6b7280; padding-left: 16px; } svg { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: #4b5563; } } }
`;

const NavItem = styled.div`
  display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; color: #9ca3af; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s; position: relative;
  &:hover { color: #f3f4f6; background: rgba(255,255,255,0.02); }
  &.active { background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 100%); color: #fff; border-left: 2px solid #3b82f6; }
  .arrow { margin-left: auto; color: #4b5563; }
`;

const MainArea = styled.main` flex: 1; display: flex; flex-direction: column; overflow-y: auto; `;

const TopBar = styled.header`
  display: flex; justify-content: space-between; align-items: center; padding: 20px 40px;
  .top-left-actions { display: flex; align-items: center; gap: 20px; }
  .back-btn { display: flex; align-items: center; gap: 6px; background: #151b2b; border: 1px solid #1f2937; color: #9ca3af; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; &:hover { background: #1a2235; color: #fff; border-color: #3b82f6; } }
  .search-bar { display: flex; align-items: center; gap: 12px; background: #151b2b; border: 1px solid #1f2937; padding: 10px 16px; border-radius: 8px; width: 380px; input { background: transparent; border: none; outline: none; color: #fff; width: 100%; font-size: 0.9rem; } input::placeholder { color: #6b7280; } }
  .top-right { display: flex; align-items: center; gap: 24px; }
  .icon-btn { background: transparent; border: none; color: #9ca3af; cursor: pointer; &:hover { color: #fff; } }
  .user-profile { display: flex; align-items: center; gap: 12px; .avatar { width: 36px; height: 36px; border-radius: 50%; background: #1e3a8a; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; } .user-info { display: flex; flex-direction: column; .name { font-size: 0.85rem; font-weight: 600; color: #f3f4f6; } .role { font-size: 0.7rem; color: #9ca3af; } } }
`;

const ContentWrapper = styled.div` padding: 0 40px 40px 40px; display: flex; flex-direction: column; gap: 24px; `;

const PageHeader = styled.div`
  display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;
  .titles h1 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
  .titles p { margin: 6px 0 0 0; font-size: 0.85rem; color: #9ca3af; }
  .live-badge { display: flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: #10b981; .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; } .pulse-dot.syncing { animation: ${pulseSync} 1s infinite; } }
`;

const StatsGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; `;

const StatCard = styled.div`
  background: #111520; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; display: flex; align-items: center; gap: 20px; position: relative; overflow: hidden;
  &.red-glow { border-left: 3px solid #ef4444; box-shadow: inset 30px 0 40px -30px rgba(239, 68, 68, 0.4); }
  &.blue-glow { border-left: 3px solid #3b82f6; box-shadow: inset 30px 0 40px -30px rgba(59, 130, 246, 0.4); }
  &.green-glow { border-left: 3px solid #10b981; box-shadow: inset 30px 0 40px -30px rgba(16, 185, 129, 0.4); }
  .icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; &.red { background: rgba(239, 68, 68, 0.15); color: #ef4444; } &.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; } &.green { background: rgba(16, 185, 129, 0.15); color: #10b981; } }
  .stat-info { flex: 1; }
  h3 { margin: 0 0 8px 0; font-size: 0.75rem; color: #9ca3af; font-weight: 600; }
  .value-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .value { font-size: 1.8rem; font-weight: 700; color: #fff; line-height: 1; }
  .value.text-status { font-size: 1.2rem; color: #10b981; letter-spacing: 1px; }
  .subtitle { margin: 0; font-size: 0.75rem; color: #6b7280; }
`;

const DataPanels = styled.div` display: grid; grid-template-columns: 2fr 1fr; gap: 24px; min-height: 380px; `;

const MatrixPanel = styled.div`
  background: #111520; border: 1px solid #1f2937; border-radius: 12px; display: flex; flex-direction: column;
  .panel-top { padding: 16px 24px; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center; }
  .panel-title { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 700; color: #fff; letter-spacing: 1px; }
  .time-filters { display: flex; background: #0B0F19; border: 1px solid #1f2937; border-radius: 6px; padding: 4px; button { background: transparent; border: none; color: #9ca3af; font-size: 0.75rem; font-weight: 600; padding: 4px 12px; border-radius: 4px; cursor: pointer; &.active { background: #1e293b; color: #3b82f6; } } }
  .table-container { flex: 1; display: flex; flex-direction: column; overflow-y: auto; max-height: 320px; }
  .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; .empty-icon { width: 64px; height: 64px; background: rgba(59,130,246,0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #6b7280; margin-bottom: 16px; } h3 { margin: 0 0 8px 0; font-size: 1.1rem; color: #f3f4f6; } p { margin: 0; font-size: 0.85rem; color: #6b7280; text-align: center; } }
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; text-align: left;
  th { position: sticky; top: 0; background: #111520; padding: 16px 24px; font-size: 0.7rem; color: #9ca3af; font-weight: 700; letter-spacing: 1px; border-bottom: 1px solid #1f2937; z-index: 10; }
  td { padding: 16px 24px; font-size: 0.85rem; border-bottom: 1px solid #1f2937; color: #d1d5db; }
  tr:hover { background: #151b2b; }
  tr.new-entry { animation: ${flashRow} 2s ease-out; }
  .mono { font-family: monospace; }
  .node-name { color: #9ca3af; font-weight: 600; }
  .identity { display: flex; align-items: center; gap: 6px; color: #00ffff; font-weight: 700; font-family: monospace; }
  .confidence-bar { display: flex; align-items: center; width: 120px; height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; .fill { height: 100%; border-radius: 3px; } }
  .badge { background: rgba(0, 255, 255, 0.15); color: #00ffff; padding: 4px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; }
`;

const ProfilePanel = styled.div`
  background: #111520; border: 1px solid #1f2937; border-radius: 12px; display: flex; flex-direction: column; transition: all 0.3s ease;
  &.active-threat { border-top: 2px solid #ef4444; box-shadow: inset 0 40px 40px -40px rgba(239, 68, 68, 0.15); }
  .panel-top { padding: 16px 24px; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center; }
  .panel-title { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; letter-spacing: 1px; color: #fff; }
  .panel-title.alert { color: #ef4444; }
  .profile-content { flex: 1; display: flex; flex-direction: column; }
  .empty-profile { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; .glowing-shield { position: relative; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; .ripple { position: absolute; width: 60px; height: 60px; border-radius: 50%; border: 2px solid #ef4444; animation: ${rippleEffect} 2s infinite; } } h3 { margin: 0 0 8px 0; font-size: 1.1rem; color: #f3f4f6; } p { margin: 0; font-size: 0.85rem; color: #6b7280; text-align: center; } }
  .threat-data { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .target-wireframe { width: 100%; height: 120px; background: #0B0F19; border: 1px solid #1f2937; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden; gap: 8px; .scanner-line { position: absolute; width: 100%; height: 2px; background: rgba(239, 68, 68, 0.8); box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); animation: ${scan} 2.5s linear infinite; } .glow-text { color: #ef4444; font-size: 0.75rem; font-weight: 800; letter-spacing: 2px; font-family: monospace; } }
  .intel-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .intel-block { label { display: block; font-size: 0.7rem; color: #6b7280; font-weight: 700; letter-spacing: 1px; margin-bottom: 6px; } p { margin: 0; font-size: 0.95rem; color: #f3f4f6; font-weight: 600; } .high-alert { color: #ef4444; font-size: 1.05rem; } }
  .behavior-box { background: #0B0F19; border: 1px solid #1f2937; border-radius: 8px; padding: 12px; p { margin: 0; color: #d1d5db; font-size: 0.8rem; line-height: 1.5; } }
`;

const TerminalPanel = styled.div`
  background: #07090e; border: 1px solid #1f2937; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; margin-top: 8px;
  .terminal-header { background: #0f172a; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2937; .t-left { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #38bdf8; font-family: monospace; letter-spacing: 1px; } .t-status { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: #10b981; font-weight: 700; font-family: monospace; .dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; } } }
  .terminal-body { padding: 14px 20px; max-height: 130px; overflow-y: auto; font-family: 'Courier New', Courier, monospace; font-size: 0.8rem; display: flex; flex-direction: column; gap: 6px; scroll-behavior: smooth; .terminal-line { color: #94a3b8; &.success { color: #10b981; } &.alert { color: #ef4444; font-weight: bold; } .t-time { color: #475569; margin-right: 8px; } } }
`;

export default ThreatIntelligence;