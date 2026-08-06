import React, { useState, useEffect } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  blurhash?: string;
  className?: string;
}

export function LazyImage({ src, alt, className = '', ...props }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const validSrc = (src && typeof src === 'string' && src.trim() !== '') 
    ? src 
    : 'https://picsum.photos/seed/bookplaceholder/300/400';

  useEffect(() => {
    // Reset state if src changes
    setIsLoaded(false);
    setHasError(false);
  }, [validSrc]);

  return (
    <div className={`relative overflow-hidden bg-white/5 ${className}`}>
      {/* Low-res placeholder / blur effect */}
      <div 
        className={`absolute inset-0 bg-white/10 backdrop-blur-xl transition-opacity duration-700 ease-in-out ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      
      {/* Loading Spinner for extra feedback (optional) */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
        </div>
      )}

      {/* The actual image */}
      <img
        src={validSrc}
        alt={alt || ''}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsLoaded(true);
          setHasError(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5">
          <span className="text-white/40 text-xs text-center px-2">Image not found</span>
        </div>
      )}
    </div>
  );
}
