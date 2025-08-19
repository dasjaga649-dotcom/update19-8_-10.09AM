import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RelatedContent {
  image: string;
  title: string;
  url: string;
}

interface HorizontalScrollableCardsProps {
  content: RelatedContent[];
  isDarkMode?: boolean;
}

export const HorizontalScrollableCards = ({
  content,
  isDarkMode = false,
}: HorizontalScrollableCardsProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (content.length === 0) return null;

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -280, // Card width + gap
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 280, // Card width + gap
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleCardClick = (url: string) => {
    window.open(url, "_blank", "noopener noreferrer");
  };

  return (
    <div className="mt-4 relative">
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 transition-all duration-200 transform hover:scale-110 shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: "#176CAE",
              backdropFilter: "blur(8px)",
            }}
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 transition-all duration-200 transform hover:scale-110 shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: "#176CAE",
              backdropFilter: "blur(8px)",
            }}
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-8"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitScrollbar: { display: "none" },
          }}
        >
          {content.map((item, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(item.url)}
              className={`flex-shrink-0 w-64 cursor-pointer group transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600 hover:border-gray-500"
                  : "bg-white border-gray-200 hover:border-gray-300"
              } border rounded-lg overflow-hidden shadow-md`}
            >
              {/* Image */}
              <div className="relative w-full h-40 overflow-hidden">
                <img
                  src={
                    item.image ||
                    "https://hutechsolutions.com/wp-content/uploads/2024/08/hutech-logo-1.svg"
                  }
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  style={{ borderRadius: "8px 8px 0 0" }}
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
              </div>

              {/* Title */}
              <div className="p-4">
                <h3
                  className={`font-medium text-sm leading-tight group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
