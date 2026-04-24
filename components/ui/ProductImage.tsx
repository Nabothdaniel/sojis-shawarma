'use client';

import Image from 'next/image';
import React from 'react';

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
  const isSvg = src?.toLowerCase().endsWith('.svg');

  if (isSvg) {
    return (
      <div className={`relative overflow-hidden bg-transparent ${className}`}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain bg-transparent"
          style={{ backgroundColor: 'transparent' }}
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
      />
    </div>
  );
}
