'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';

const GENERIC_PRODUCT_IMAGE = '/images/beef-supreme.png';

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
  const [activeSrc, setActiveSrc] = useState(src || GENERIC_PRODUCT_IMAGE);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => {
    setActiveSrc(src || GENERIC_PRODUCT_IMAGE);
    setFallbackFailed(false);
  }, [src]);

  if (fallbackFailed) {
    return (
      <div className={`relative overflow-hidden bg-surface-container-high ${fill ? 'h-full w-full' : ''} ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <span className="material-symbols-outlined text-outline/30 text-4xl">image_not_supported</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-transparent ${fill ? 'h-full w-full' : ''} ${className}`}>
      <Image
        src={activeSrc}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        priority={priority}
        className="object-contain bg-transparent"
        style={{ backgroundColor: 'transparent' }}
        onError={() => {
          if (activeSrc !== GENERIC_PRODUCT_IMAGE) {
            setActiveSrc(GENERIC_PRODUCT_IMAGE);
            return;
          }

          setFallbackFailed(true);
        }}
        unoptimized
      />
    </div>
  );
}
