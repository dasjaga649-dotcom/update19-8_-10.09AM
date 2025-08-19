import { Plus } from "lucide-react";

interface RecommendationsProps {
  recommendations: string[];
  onSelect: (question: string) => void;
  isDarkMode?: boolean;
}

export const Recommendations = ({
  recommendations,
  onSelect,
  isDarkMode = false,
}: RecommendationsProps) => {
  if (recommendations.length === 0) return null;

  return (
    <div
      className={`${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"} border rounded-lg shadow-sm overflow-hidden`}
    >
      {recommendations.map((recommendation, index) => (
        <button
          key={index}
          onClick={() => onSelect(recommendation)}
          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors duration-200 ${
            isDarkMode
              ? "hover:bg-gray-700 text-gray-100"
              : "hover:bg-gray-50 text-gray-800"
          } ${index !== recommendations.length - 1 ? "border-b border-gray-200 dark:border-gray-600" : ""}`}
        >
          <span className="text-sm flex-1 pr-3">{recommendation}</span>
          <Plus
            size={16}
            className={`flex-shrink-0 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          />
        </button>
      ))}
    </div>
  );
};
