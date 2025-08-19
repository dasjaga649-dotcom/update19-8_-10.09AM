import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RelatedContent {
  image: string;
  title: string;
  url: string;
}

interface ImageContent {
  url: string;
  alt: string;
}

// Union type to support both formats
type CarouselItem = RelatedContent | ImageContent;

interface StackedImageCarouselProps {
  content?: RelatedContent[];
  images?: ImageContent[];
  isDarkMode?: boolean;
}

export const StackedImageCarousel = ({
  content,
  images,
  isDarkMode = false,
}: StackedImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize data to work with both formats
  const normalizedItems: Array<{src: string, title: string, url?: string}> = React.useMemo(() => {
    if (images) {
      return images.map(img => ({
        src: img.url,
        title: img.alt || 'Image',
        url: undefined // Images from markdown don't have clickable URLs
      }));
    }

    if (content) {
      return content.map(item => ({
        src: item.image,
        title: item.title,
        url: item.url
      }));
    }

    return [];
  }, [content, images]);

  if (normalizedItems.length === 0) return null;

  const nextContent = () => {
    setCurrentIndex((prev) => (prev + 1) % normalizedItems.length);
  };

  const prevContent = () => {
    setCurrentIndex((prev) => (prev - 1 + normalizedItems.length) % normalizedItems.length);
  };

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (normalizedItems.length === 1) {
    const item = normalizedItems[0];
    const containerContent = (
      <>
        <img
          src={item.src || "https://hutechsolutions.com/wp-content/uploads/2024/08/hutech-logo-1.svg"}
          alt={item.title}
          className="w-full h-32 object-cover bg-gray-100"
        />
        <div className="p-2 bg-transparent">
          <h5
            className={`font-medium text-xs line-clamp-2 text-center ${isDarkMode ? "text-white" : "text-gray-800"} ${item.url ? "hover:text-blue-600 cursor-pointer" : ""}`}
          >
            {item.title}
          </h5>
        </div>
      </>
    );

    return (
      <div className="mt-4 flex justify-center">
        <div className="max-w-xs p-4 rounded-lg">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block ${isDarkMode ? "border-gray-600" : "border-gray-200"} border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]`}
            >
              {containerContent}
            </a>
          ) : (
            <div className={`block ${isDarkMode ? "border-gray-600" : "border-gray-200"} border rounded-xl overflow-hidden shadow-md`}>
              {containerContent}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex justify-center">
      <div className="relative w-full max-w-md p-4 rounded-lg">
        {/* Carousel container with centered layout */}
        <div className="relative h-48 flex items-center justify-center perspective-1000">
          {normalizedItems.map((item, index) => {
            const isActive = index === currentIndex;
            const isPrev =
              index === (currentIndex - 1 + normalizedItems.length) % normalizedItems.length;
            const isNext = index === (currentIndex + 1) % normalizedItems.length;

            let transformStyle = "";
            let opacityValue = 0;
            let zIndexValue = 0;
            let scaleValue = 1;

            if (isActive) {
              transformStyle = "translateX(0) translateZ(0)";
              opacityValue = 1;
              zIndexValue = 30;
              scaleValue = 1;
            } else if (isPrev) {
              transformStyle = "translateX(-70px) translateZ(-50px)";
              opacityValue = 0.7;
              zIndexValue = 20;
              scaleValue = 0.85;
            } else if (isNext) {
              transformStyle = "translateX(70px) translateZ(-50px)";
              opacityValue = 0.7;
              zIndexValue = 20;
              scaleValue = 0.85;
            } else {
              transformStyle = "translateX(0) translateZ(-100px)";
              opacityValue = 0.4;
              zIndexValue = 10;
              scaleValue = 0.7;
            }

            return (
              <div
                key={index}
                className="absolute transition-all duration-500 ease-in-out transform-gpu cursor-pointer"
                style={{
                  transform: `${transformStyle} scale(${scaleValue})`,
                  opacity: opacityValue,
                  zIndex: zIndexValue,
                  left: "50%",
                  top: "50%",
                  marginLeft: "-120px",
                  marginTop: "-60px",
                  width: "240px",
                }}
                onClick={() => handleImageClick(index)}
              >
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block ${isDarkMode ? "border-gray-600" : "border-gray-200"} border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 ${isActive ? "shadow-xl ring-2 ring-blue-400" : "shadow-md hover:shadow-lg"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img
                      src={
                        item.src ||
                        "https://hutechsolutions.com/wp-content/uploads/2024/08/hutech-logo-1.svg"
                      }
                      alt={item.title}
                      className="w-full h-28 object-cover bg-gray-100"
                    />
                    <div className="p-2 bg-white/90 backdrop-blur-sm">
                      <h5
                        className={`font-medium text-xs hover:text-blue-600 cursor-pointer line-clamp-1 text-center ${isDarkMode ? "text-gray-800" : "text-gray-800"}`}
                      >
                        {item.title}
                      </h5>
                    </div>
                  </a>
                ) : (
                  <div
                    className={`block ${isDarkMode ? "border-gray-600" : "border-gray-200"} border rounded-xl overflow-hidden transition-all duration-300 ${isActive ? "shadow-xl ring-2 ring-blue-400" : "shadow-md"}`}
                  >
                    <img
                      src={
                        item.src ||
                        "https://hutechsolutions.com/wp-content/uploads/2024/08/hutech-logo-1.svg"
                      }
                      alt={item.title}
                      className="w-full h-28 object-cover bg-gray-100"
                    />
                    <div className="p-2 bg-white/90 backdrop-blur-sm">
                      <h5
                        className={`font-medium text-xs line-clamp-1 text-center ${isDarkMode ? "text-gray-800" : "text-gray-800"}`}
                      >
                        {item.title}
                      </h5>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Navigation buttons */}
          <button
            onClick={prevContent}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm transform hover:scale-110"
            style={{ backgroundColor: "#176CAE" }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={nextContent}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-40 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm transform hover:scale-110"
            style={{ backgroundColor: "#176CAE" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-3 mt-3">
          {normalizedItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-blue-500 scale-125"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};
