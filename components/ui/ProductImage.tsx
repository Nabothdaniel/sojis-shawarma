'use client';

import Image from 'next/image';
import React, { useState } from 'react';

interface ProductImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function ProductImage({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  priority = false
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const isSvg = src?.toLowerCase().endsWith('.svg');

  // Debugging logs
  console.log('ProductImage src:', src);
  console.log('ProductImage imageError:', imageError);

  if (!src || imageError) {
    return (
      <div className={`relative overflow-hidden bg-surface-container-high ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <span className="material-symbols-outlined text-outline/30 text-4xl">image_not_supported</span>
        </div>
      </div>
    );
  }

  if (isSvg) {
    return (
      <div className={`relative overflow-hidden bg-transparent ${className}`}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain bg-transparent"
          style={{ backgroundColor: 'transparent' }}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-transparent ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        priority={priority}
        className="object-contain bg-transparent mix-blend-multiply"
        style={{ backgroundColor: 'transparent' }}
        onError={() => setImageError(true)}
        unoptimized
      />
    </div>
  );
}
