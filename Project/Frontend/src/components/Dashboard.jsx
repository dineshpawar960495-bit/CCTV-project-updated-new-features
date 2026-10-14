import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { ShieldAlert, LogOut } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const services = [
    {
      id: 'feed-matrix',
      title: 'LIVE FEED MATRIX',
      description: 'Monitor real-time AI tracking, bounding boxes, and active zone breaches across all connected surveillance nodes.',
      imagePath: '/feed.png', // TODO: Add image path here (e.g., '/assets/feed-preview.jpg')
      path: '/preview',
      themeColor: '#10b981' // Emerald Glow
    },
    {
      id: 'threat-intel',
      title: 'THREAT INTELLIGENCE',
      description: 'Access automated database logs, historical breach analytics, and target behavior profiles logged by the AI engine.',
      imagePath: '/threat.png', // TODO: Add image path here
      path: '/threat-intelligence',
      themeColor: '#ef4444' // Red Glow
    },
    {
      id: 'hardware-config',
      title: 'HARDWARE MANAGEMENT',
      description: 'Configure external IP cameras, map RTSP network streams, and manage active processing configurations.',
      imagePath: '/IP.png', // TODO: Add image path here
      path: '/manage-cameras',
      themeColor: '#00FFFF' // Cyan Glow
    }
  ];

  return (
    <DashboardWrapper>
      <Header>
        <div className="header-left">
          <div className="logo-box">
            <ShieldAlert size={24} color="#00FFFF" />
          </div>
          <div className="header-titles">
            <h1>SENTINEL COMMAND CENTER</h1>
            <p>System Architecture & Microservices Control</p>
          </div>
        </div>
        
        <button className="logout-btn" onClick={() => navigate('/login')}>
          <LogOut size={18} />
          DISCONNECT
        </button>
      </Header>

      <MainContent>
        <div className="welcome-banner">
          <h2>ACTIVE SERVICES</h2>
          <p>Select a module to initialize the interface.</p>
        </div>

        <ServiceGrid>
          {services.map((service) => (
            <StyledWrapper key={service.id} $themeColor={service.themeColor}>
              <div className="card" onClick={() => navigate(service.path)}>
                
                {/* Front Face: Image / Placeholder */}
                <div className="card__image-container">
                  {service.imagePath ? (
                    <img src={service.imagePath} alt={service.title} className="card__image" />
                  ) : (
                    <div className="image-placeholder">
                      <span>[ IMAGE SLOT: {service.title} ]</span>
                    </div>
                  )}
                </div>

                {/* Back Face: Content (Flips down on hover) */}
                <div className="card__content">
                  <p className="card__title">{service.title}</p>
                  <p className="card__description">{service.description}</p>
                  <div className="card__action">
                    <span>OPEN_SERVICE</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

              </div>
            </StyledWrapper>
          ))}
        </ServiceGrid>
      </MainContent>
    </DashboardWrapper>
  );
};

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const DashboardWrapper = styled.div`
  min-height: 100vh;
  background-color: #030712;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: #0f172a;
  border-bottom: 1px solid #1e293b;

  .header-left { display: flex; align-items: center; gap: 20px; }
  .logo-box { background: rgba(0, 255, 255, 0.1); padding: 12px; border-radius: 12px; border: 1px solid rgba(0, 255, 255, 0.2); display: flex; align-items: center; justify-content: center; }
  .header-titles h1 { margin: 0; font-size: 1.25rem; letter-spacing: 1.5px; font-weight: 700; color: #ffffff; }
  .header-titles p { margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b; letter-spacing: 0.5px; }

  .logout-btn {
    display: flex; align-items: center; gap: 8px; background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; letter-spacing: 1px;
    &:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }
  }
`;

const MainContent = styled.main`
  flex: 1; padding: 40px; max-width: 1400px; margin: 0 auto; width: 100%; animation: ${fadeIn} 0.4s ease-out;

  .welcome-banner {
    margin-bottom: 40px;
    h2 { font-size: 1.5rem; color: #f8fafc; margin: 0 0 8px 0; letter-spacing: 1px; }
    p { color: #94a3b8; margin: 0; font-size: 1rem; }
  }
`;

const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 30px;
`;

// 3D Flip Card Implementation
const StyledWrapper = styled.div`
  .card {
    position: relative;
    width: 100%;
    height: 260px;
    background-color: #0f172a;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    perspective: 1000px;
    border: 1px solid #1e293b;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    cursor: pointer;
  }

  .card__image-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111827;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .card__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.8;
  }

  .image-placeholder {
    color: #334155;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 1px;
    border: 1px dashed #334155;
    padding: 20px;
    border-radius: 8px;
  }

  .card:hover {
    transform: scale(1.03);
    box-shadow: 0 15px 40px ${props => props.$themeColor}25;
    border-color: ${props => props.$themeColor}80;
  }

  /* Shrink the image to 0 on hover, just like the SVG in the original design */
  .card:hover .card__image-container {
    scale: 0;
    opacity: 0;
  }

  .card__content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 30px;
    box-sizing: border-box;
    background: linear-gradient(145deg, #111827 0%, #0f172a 100%);
    border-top: 4px solid ${props => props.$themeColor};
    transform: rotateX(-90deg);
    transform-origin: bottom;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .card:hover .card__content {
    transform: rotateX(0deg);
  }

  .card__title {
    margin: 0 0 12px 0;
    font-size: 1.4rem;
    color: #f8fafc;
    font-weight: 800;
    letter-spacing: 1.5px;
  }

  .card__description {
    margin: 0;
    font-size: 0.95rem;
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .card__action {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${props => props.$themeColor};
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 1px;
    margin-top: auto;

    svg {
      transition: transform 0.3s ease;
    }
  }

  .card:hover .card__action svg {
    transform: translateX(6px);
  }
`;

export default Dashboard;