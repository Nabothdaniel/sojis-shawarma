'use client';

import React from 'react';

interface SpinnerProps {
  size?: number;
  thickness?: number;
}

export default function Spinner({ size = 28, thickness = 3 }: SpinnerProps) {
  return (
    <>
      <span
        className="google-spinner"
        style={{
          width: size,
          height: size,
          borderWidth: thickness,
        }}
        aria-hidden="true"
      />

      <style jsx>{`
        .google-spinner {
          display: inline-block;
          border-style: solid;
          border-radius: 50%;
          border-top-color: #4285f4;
          border-right-color: #ea4335;
          border-bottom-color: #fbbc05;
          border-left-color: #34a853;
          animation: spinner-rotate 0.85s linear infinite;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.6) inset;
        }

        @keyframes spinner-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
