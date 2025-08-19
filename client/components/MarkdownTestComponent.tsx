import React from 'react';
import { TextProcessor } from './TextProcessor';
import { ModernFileLinks } from './ModernFileLinks';

interface MarkdownTestProps {
  isDarkMode?: boolean;
}

export const MarkdownTestComponent: React.FC<MarkdownTestProps> = ({ isDarkMode = false }) => {
  const testContent = `Here are our available resources:

**Documents Available:**
- [Hutech Solutions Brochures](https://hutechsolutions.com/brochures) - Complete service overview
- [Technical Documentation](https://docs.example.com/tech) - Development guides
- [Company Profile](https://hutechsolutions.com/profile.pdf) - Learn about our company

**Images and Media:**
![Company Logo](https://via.placeholder.com/150x75/333333/ffffff?text=Hutech+Logo)

Visit our [main website](https://hutechsolutions.com) for more information.

![Team Photo](https://via.placeholder.com/400x200/0066cc/ffffff?text=Our+Team)

**Key Services:**
- **Cloud Solutions**: [AWS Services](https://aws.amazon.com) and [Azure Platform](https://azure.microsoft.com)
- **Development**: Custom software solutions
- **Consulting**: Technical expertise

Contact us at [info@hutechsolutions.com](mailto:info@hutechsolutions.com)`;

  const testFileLinks = [
    {
      title: "Hutech Solutions Brochures | Company Overview",
      url: "https://hutechsolutions.com/files/brochures.pdf"
    },
    {
      title: "Technical Documentation (PDF)",
      url: "https://docs.example.com/technical-guide.pdf"
    },
    "https://hutechsolutions.com/files/company-profile.docx",
    {
      title: "Service Catalog | Hutech Solutions Services",
      url: "https://files.example.com/services.zip"
    }
  ];

  return (
    <div className={`p-6 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Markdown Link Handling Test
      </h3>
      
      <div className="space-y-6">
        {/* Test Markdown Processing */}
        <div>
          <h4 className={`text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Processed Content (Links show as text, Images render):
          </h4>
          <div className={`p-4 rounded border ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-gray-50 border-gray-300'
          }`}>
            <TextProcessor 
              content={testContent}
              isDarkMode={isDarkMode}
              className="text-sm"
            />
          </div>
        </div>

        {/* Test Modern File Links */}
        <div>
          <h4 className={`text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Modern File Links Component:
          </h4>
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

        {/* Expected Results */}
        <div className={`p-3 rounded-lg ${
          isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'
        }`}>
          <h4 className="font-medium mb-2">✅ Expected Results:</h4>
          <ul className="text-sm space-y-1 list-disc ml-4">
            <li>Text links like "Hutech Solutions Brochures" appear as clickable text (no brackets/parentheses)</li>
            <li>Image links render as actual images with proper styling</li>
            <li>No raw markdown symbols ([text](url) or ![alt](url)) are visible</li>
            <li>File links show modern download cards with icons and hover effects</li>
            <li>All links open in new tabs with proper security attributes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MarkdownTestComponent;
