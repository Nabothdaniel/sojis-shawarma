'use client';

import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [active, setActive] = useState(false);

  return (
    <div 
      className="tooltip-container"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {children}
      {active && (
        <div className="tooltip-box">
          {content}
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  );
}
