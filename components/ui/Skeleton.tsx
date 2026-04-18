import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ width, height, borderRadius = 8, style }) => {
  return (
    <div 
      className="skeleton-shine"
      style={{ 
        width: width || '100%', 
        height: height || '20px', 
        borderRadius,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        ...style 
      }} 
    />
  );
};

export default Skeleton;
