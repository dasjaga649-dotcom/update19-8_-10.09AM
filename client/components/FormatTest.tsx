import React from 'react';
import { TextProcessor } from './TextProcessor';

interface FormatTestProps {
  isDarkMode?: boolean;
}

export const FormatTest: React.FC<FormatTestProps> = ({ isDarkMode = false }) => {
  const testContent = `**Testing Markdown and HTML Support**

Here are some test patterns:

### Markdown Features:
- **Bold text** and *italic text*
- [External link](https://example.com)
- Code: \`console.log('Hello')\`

### List Examples:
1. First item with **bold**
2. Second item with *italic*
3. Third item with [link](https://test.com)

### Mixed Content:
<p>This is <strong>HTML bold</strong> and <em>HTML italic</em></p>

**Bullet Points:**
• **Service 1**: Description here
• **Service 2**: Another description
• **Service 3**: Final description

> This is a blockquote with **bold text**

![Test Image](https://via.placeholder.com/300x150/0066cc/ffffff?text=Test+Image)

<ul>
<li><strong>HTML List Item 1</strong></li>
<li><em>HTML List Item 2</em></li>
</ul>`;

  return (
    <div className={`p-4 rounded-lg border ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-600' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-3 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Format Test Results
      </h3>
      <TextProcessor 
        content={testContent}
        isDarkMode={isDarkMode}
        className="text-sm"
      />
    </div>
  );
};

export default FormatTest;
