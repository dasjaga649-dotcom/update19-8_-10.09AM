import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  isDarkMode?: boolean;
  className?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  alt, 
  isDarkMode = false,
  className = ""
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (imageError) {
    // Show alt text with an icon if image fails to load
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-600 text-gray-300' 
          : 'bg-gray-50 border-gray-200 text-gray-600'
      } ${className}`}>
        <ImageIcon className="w-6 h-6 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">{alt || 'Image'}</p>
          <p className="text-xs opacity-75 mt-1">Image could not be loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-4 h-4 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <img
          src={src}
          alt={alt || 'Image'}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className={`max-w-full h-auto rounded-lg border shadow-sm transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
          loading="lazy"
        />
        
        {/* Show alt text as caption if it exists and is meaningful */}
        {alt && alt !== 'Image' && !isLoading && (
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          } italic text-center px-2`}>
            {alt}
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageWithFallback;
