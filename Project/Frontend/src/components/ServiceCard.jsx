import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const ServiceCard = ({ title, description, iconPath, route, gradient }) => {
  const navigate = useNavigate();

  return (
    <StyledWrapper $gradient={gradient} onClick={() => navigate(route)}>
      <div className="container">
        <div className="card">
          {/* FRONT OF CARD */}
          <div className="front">
            <div className="card-top">
              <p className="card-top-para">MODULE</p>
            </div>
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d={iconPath} />
              </svg>
            </div>
            <p className="heading">{title}</p>
            <p className="follow">Hover to Explore</p>
          </div>

          {/* BACK OF CARD */}
          <div className="back">
            <p className="heading">{title}</p>
            <p className="description">{description}</p>
            <button className="launch-btn">OPEN</button>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;

  .container {
    height: 320px;
    width: 100%;
    max-width: 320px;
    color: #f5f5f7;
    perspective: 1000px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  }

  .card {
    width: 100%;
    height: 100%;
    background: #1c1c1e;
    border-radius: 24px;
    position: relative;
    /* Sped up from 1500ms to 800ms for a more responsive, premium feel */
    transition: transform 800ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform-style: preserve-3d;
    cursor: pointer;
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    position: absolute;
    width: 45%;
    background-color: #2c2c2e;
    top: 0;
    border-radius: 0 0 12px 12px;
    box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-top: none;
    z-index: 10;
  }

  .card-top-para {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #a1a1a6;
    margin: 0;
  }

  .container:hover > .card {
    transform: rotateX(180deg) rotateZ(-180deg);
  }

  .front,
  .back {
    height: 100%;
    width: 100%;
    border-radius: 24px;
    position: absolute;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
    /* Subtle glass border effect */
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .front {
    background: linear-gradient(145deg, rgba(44, 44, 46, 0.8), rgba(28, 28, 30, 0.8));
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .back {
    background: linear-gradient(145deg, rgba(28, 28, 30, 0.95), rgba(0, 0, 0, 0.95));
    transform: rotateX(180deg) rotateZ(-180deg);
    border: 1px solid rgba(255, 255, 255, 0.15);
    /* Back side glowing shadow utilizing the gradient prop */
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  }

  .icon-wrapper {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: ${props => props.$gradient};
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  }

  .icon-wrapper svg {
    width: 36px;
    height: 36px;
    fill: #ffffff;
  }

  .heading {
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 8px 0;
  }

  .follow {
    font-size: 14px;
    font-weight: 500;
    color: #a1a1a6;
    margin: 0;
  }

  .description {
    font-size: 15px;
    color: #a1a1a6;
    line-height: 1.5;
    margin-bottom: 24px;
  }

  .launch-btn {
    background: ${props => props.$gradient};
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 30px;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 1px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s ease;
  }

  .launch-btn:hover {
    transform: scale(1.05);
  }
`;

export default ServiceCard;