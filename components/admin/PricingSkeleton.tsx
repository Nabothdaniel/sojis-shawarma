'use client';

import React from 'react';

export default function PricingSkeleton() {
  return (
    <div style={{ padding: '0 24px' }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '20px 0', 
          borderBottom: '1px solid var(--color-border)',
          gap: '24px'
        }}>
          {/* Service Name */}
          <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="skeleton-pulse" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
            <div className="skeleton-pulse" style={{ width: '120px', height: '18px', borderRadius: '4px' }} />
          </div>
          
          {/* Service Code */}
          <div style={{ flex: 1 }}>
            <div className="skeleton-pulse" style={{ width: '60px', height: '18px', borderRadius: '4px' }} />
          </div>
          
          {/* Pricing Control */}
          <div style={{ flex: 1.2 }}>
            <div className="skeleton-pulse" style={{ width: '100px', height: '24px', borderRadius: '6px' }} />
          </div>
          
          {/* Est. Price */}
          <div style={{ flex: 1 }}>
            <div className="skeleton-pulse" style={{ width: '80px', height: '18px', borderRadius: '4px' }} />
          </div>
          
          {/* Actions */}
          <div style={{ flex: 0.5, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <div className="skeleton-pulse" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
            <div className="skeleton-pulse" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
          </div>
        </div>
      ))}

      <style jsx>{`
        .skeleton-pulse {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 25%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(255, 255, 255, 0.03) 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
