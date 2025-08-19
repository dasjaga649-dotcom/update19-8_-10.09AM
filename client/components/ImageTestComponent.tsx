import React from 'react';
import { TextProcessor } from './TextProcessor';
import { StackedImageCarousel } from './StackedImageCarousel';
import { ModernFileLinks } from './ModernFileLinks';

interface ImageTestProps {
  isDarkMode?: boolean;
}

export const ImageTestComponent: React.FC<ImageTestProps> = ({ isDarkMode = false }) => {
  // Test content with markdown images and links
  const testMarkdownContent = `# Image and Link Processing Test

Here are some resources and images:

**Company Overview:**
Visit our [main website](https://hutechsolutions.com) for more information.

**Team Photos:**
![Hutech Team](https://via.placeholder.com/400x200/0066cc/ffffff?text=Hutech+Team+Photo)

**Office Locations:**
![Dubai Office](https://via.placeholder.com/300x200/cc6600/ffffff?text=Dubai+Office)
![London Office](https://via.placeholder.com/300x200/009966/ffffff?text=London+Office)

**Documentation:**
- [Technical Guide](https://docs.example.com/technical) - Complete development guide
- [API Reference](https://api.example.com/docs) - REST API documentation

**Project Gallery:**
![Project Dashboard](https://via.placeholder.com/500x300/663399/ffffff?text=Project+Dashboard)

For more details, contact us at [info@hutechsolutions.com](mailto:info@hutechsolutions.com)`;

  // Test file links
  const testFileLinks = [
    {
      title: "Company Brochure (2024)",
      url: "https://example.com/brochure.pdf"
    },
    {
      title: "Technical Documentation",
      url: "https://example.com/tech-docs.zip"
    }
  ];

  // Test related content (traditional format)
  const testRelatedContent = [
    {
      image: "https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Service+1",
      title: "Cloud Solutions",
      url: "https://example.com/cloud"
    },
    {
      image: "https://via.placeholder.com/400x300/4ecdc4/ffffff?text=Service+2", 
      title: "Mobile Development",
      url: "https://example.com/mobile"
    },
    {
      image: "https://via.placeholder.com/400x300/45b7d1/ffffff?text=Service+3",
      title: "AI & Machine Learning", 
      url: "https://example.com/ai"
    }
  ];

  return (
    <div className={`space-y-8 p-6 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <h2 className={`text-xl font-bold ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Enhanced Image & Link Processing Test
      </h2>

      {/* Test Markdown Processing */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          1. Markdown Processing
        </h3>
        <div className={`p-4 rounded border ${
          isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-gray-50 border-gray-300'
        }`}>
          <TextProcessor 
            content={testMarkdownContent}
            isDarkMode={isDarkMode}
            className="prose-sm"
          />
        </div>
      </div>

      {/* Test Modern File Links */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          2. Modern File Downloads
        </h3>
        <div className={`p-4 rounded border ${
          isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-gray-50 border-gray-300'
        }`}>
          <ModernFileLinks 
            fileLinks={testFileLinks}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Test Related Content Carousel */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${
          isDarkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          3. Related Content Carousel
        </h3>
        <div className={`p-4 rounded border ${
          isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-gray-50 border-gray-300'
        }`}>
          <StackedImageCarousel 
            content={testRelatedContent}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Expected Results */}
      <div className={`p-4 rounded-lg ${
        isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
      } border`}>
        <h4 className={`font-semibold mb-3 ${
          isDarkMode ? 'text-green-300' : 'text-green-800'
        }`}>
          ✅ Expected Results:
        </h4>
        <ul className={`text-sm space-y-2 list-disc ml-4 ${
          isDarkMode ? 'text-green-200' : 'text-green-700'
        }`}>
          <li><strong>Markdown Images:</strong> Render as actual images with proper alt text captions</li>
          <li><strong>Markdown Links:</strong> Display as clickable text only (no brackets/parentheses)</li>
          <li><strong>Image Alt Text:</strong> Used as meaningful labels, not "Image 1" or "Image 2"</li>
          <li><strong>Error Handling:</strong> If image fails to load, show alt text with icon</li>
          <li><strong>File Downloads:</strong> Modern cards with icons and hover effects</li>
          <li><strong>Related Content:</strong> Interactive carousel with clickable links</li>
          <li><strong>Extracted Images:</strong> Separate carousel showing markdown images with alt text</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageTestComponent;
