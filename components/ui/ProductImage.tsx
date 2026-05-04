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
      <div className={`relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,197,24,0.12),_rgba(255,255,255,0.92)_55%,_rgba(240,233,220,0.9))] ${fill ? 'h-full w-full' : ''} ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <span className="material-symbols-outlined text-outline/30 text-4xl">image_not_supported</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,197,24,0.14),_rgba(255,248,235,0.94)_58%,_rgba(236,230,220,0.92))] ${fill ? 'h-full w-full' : ''} ${className}`}>
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
