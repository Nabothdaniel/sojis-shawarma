'use client';

import React from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  return (
    <div
      className="tooltip-container"
      tabIndex={0}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      {children}
      <div className="tooltip-box">
        {content}
        <div className="tooltip-arrow"></div>
      </div>

      <style jsx>{`
        .tooltip-box {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 12px);
          transform: translateX(-50%) translateY(6px);
          min-width: 180px;
          max-width: 260px;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(10, 14, 25, 0.96);
          color: #f8fafc;
          font-size: 0.75rem;
          line-height: 1.5;
          box-shadow: 0 16px 36px rgba(2, 6, 23, 0.28);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          z-index: 1200;
        }

        .tooltip-arrow {
          position: absolute;
          left: 50%;
          top: 100%;
          width: 10px;
          height: 10px;
          background: rgba(10, 14, 25, 0.96);
          transform: translateX(-50%) rotate(45deg);
          border-radius: 2px;
        }

        .tooltip-container:hover .tooltip-box,
        .tooltip-container:focus-within .tooltip-box,
        .tooltip-container:focus .tooltip-box {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>
    </div>
  );
}
