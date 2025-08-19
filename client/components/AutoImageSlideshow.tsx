import { useState, useEffect } from "react";

interface AutoImageSlideshowProps {
  images: Array<{
    url: string;
    title: string;
  }>;
}

const DEFAULT_IMAGE = "https://hutechsolutions.com/wp-content/uploads/2024/08/hutech-logo-1.svg";

export const AutoImageSlideshow = ({ images }: AutoImageSlideshowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance functionality
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 500); // 0.5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="mt-4 relative w-full max-w-md mx-auto">
        <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <img
            src={images[0].url}
            alt={images[0].title}
            className="w-full h-auto object-contain transition-opacity duration-500"
            style={{ maxHeight: 'none' }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src !== DEFAULT_IMAGE) {
                img.src = DEFAULT_IMAGE;
              }
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <h3 className="text-white font-bold text-center text-sm sm:text-base drop-shadow-lg">
              {images[0].title}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 relative w-full max-w-md mx-auto">
      <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-auto object-contain"
              style={{ maxHeight: 'none' }}
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src !== DEFAULT_IMAGE) {
                  img.src = DEFAULT_IMAGE;
                }
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <h3 className="text-white font-bold text-center text-sm sm:text-base drop-shadow-lg">
                {image.title}
              </h3>
            </div>
          </div>
        ))}

        {/* Dots indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
