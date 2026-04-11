import React from 'react';
import { RiInformationLine } from 'react-icons/ri';

interface StatusBannerProps {
  message: string;
  onClose: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ message, onClose }) => {
  return (
    <div style={{
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'start',
      gap: 12,
      position: 'relative',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <RiInformationLine size={20} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#FECACA', fontWeight: 500, lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      <button 
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
      >
        ×
      </button>
    </div>
  );
};
