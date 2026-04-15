'use client';

import React from 'react';

interface UserAvatarProps {
  seed: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Random Avatar component using Dicebear API.
 * Style: 'avataaars' (tunable via seed which is the username).
 */
export default function UserAvatar({ seed, size = 34, className, style }: UserAvatarProps) {
  // Use 'avataaars' style from Dicebear for a modern look
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

  return (
    <div 
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'var(--color-bg-hover)',
        border: '2px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={avatarUrl} 
        alt={seed}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
