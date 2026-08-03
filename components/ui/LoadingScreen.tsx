import React from 'react';

type LoadingScreenProps = {
  message?: string;
  fullScreen?: boolean;
};

export default function LoadingScreen({ message = 'loading...', fullScreen = true }: LoadingScreenProps) {
  return (
    <div className={`flex w-full flex-col items-center justify-center bg-surface p-4 ${fullScreen ? 'h-screen' : 'py-20 h-auto'}`}>
      <div className="w-12 h-12 border-4 border-surface-variant border-t-primary rounded-full animate-spin mb-4" />
      <p className="font-label text-sm font-bold lowercase tracking-widest text-outline text-center">
        {message}
      </p>
    </div>
  );
}
