import React from 'react';
import styled from 'styled-components';
import { PenTool, Save } from 'lucide-react';

const ZoneEditButton = ({ onClick, isEditing }) => {
  return (
    <ButtonWrapper onClick={onClick} $isEditing={isEditing}>
      {isEditing ? (
        <>
          <Save size={14} />
          Save Zone
        </>
      ) : (
        <>
          <PenTool size={14} />
          Draw Zone
        </>
      )}
    </ButtonWrapper>
  );
};

const ButtonWrapper = styled.button`
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  z-index: 25;
  transition: all 0.2s ease;
  
  /* Dynamic styling based on whether the user is actively drawing */
  background: ${props => props.$isEditing ? '#10b981' : 'rgba(15, 23, 42, 0.85)'};
  color: ${props => props.$isEditing ? '#ffffff' : '#94a3b8'};
  border: 1px solid ${props => props.$isEditing ? '#10b981' : 'rgba(255, 255, 255, 0.15)'};
  box-shadow: ${props => props.$isEditing ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none'};

  &:hover {
    background: ${props => props.$isEditing ? '#059669' : 'rgba(15, 23, 42, 1)'};
    color: #ffffff;
    border-color: ${props => props.$isEditing ? '#059669' : '#3b82f6'};
  }
`;

export default ZoneEditButton;