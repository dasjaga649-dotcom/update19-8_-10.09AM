import React, { useState } from 'react';
import { TextProcessor } from '../components/TextProcessor';
import { Button } from '../components/ui/button';
import { MarkdownTestComponent } from '../components/MarkdownTestComponent';
import { ImageTestComponent } from '../components/ImageTestComponent';

const TestFormatting: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  const testPatterns = [
    {
      title: "Markdown Lists and Bold Text",
      content: `**Services we provide:**

• **Cloud Solutions**: AWS, Azure, Google Cloud
• **Web Development**: React, Next.js, Vue.js
• **Mobile Apps**: React Native, Flutter
• **AI/ML**: TensorFlow, PyTorch, OpenAI

Visit our [website](https://example.com) for more information.`
    },
    {
      title: "HTML Mixed Content",
      content: `<h2>Our Technologies</h2>
<p>We specialize in <strong>cutting-edge technologies</strong>:</p>
<ul>
<li>Frontend: <em>React, Vue, Angular</em></li>
<li>Backend: <strong>Node.js, Python, Java</strong></li>
<li>Databases: <code>MongoDB, PostgreSQL, Redis</code></li>
</ul>
<blockquote>
Innovation is our key to success
</blockquote>`
    },
    {
      title: "Markdown with Images",
      content: `# Project Gallery

Here are some screenshots of our work:

![Dashboard](https://via.placeholder.com/400x200/0066cc/ffffff?text=Dashboard)

**Features:**
- Real-time analytics
- **Responsive design**
- Mobile-first approach

![Mobile View](https://via.placeholder.com/200x400/cc6600/ffffff?text=Mobile+View)`
    },
    {
      title: "Complex Markdown",
      content: `## Service Overview

### **Cloud Infrastructure:**
* **AWS Services**: EC2, S3, Lambda, RDS
* **Azure Solutions**: App Service, Cosmos DB
* **Google Cloud**: Compute Engine, Cloud Storage

[Contact us](mailto:info@example.com) for a **free consultation**.

> **Note**: All services come with 24/7 support.

### Code Example:
\`\`\`javascript
const api = async () => {
  const response = await fetch('/api/data');
  return response.json();
}
\`\`\``
    },
    {
      title: "HTML Lists and Tables",
      content: `<h3>Pricing Plans</h3>
<table border="1">
<tr><th>Plan</th><th>Price</th><th>Features</th></tr>
<tr><td>Basic</td><td>$10/month</td><td>5 projects</td></tr>
<tr><td>Pro</td><td>$25/month</td><td>Unlimited projects</td></tr>
</table>

<h4>Benefits:</h4>
<ol>
<li><strong>24/7 Support</strong></li>
<li><em>Money-back guarantee</em></li>
<li>Free migrations</li>
</ol>`
    },
    {
      title: "Mixed Content with Links",
      content: `**Get Started Today!**

Visit our [documentation](https://docs.example.com) to learn more.

<p>For enterprise solutions, <a href="https://enterprise.example.com" target="_blank">click here</a>.</p>

**Quick Links:**
- [API Reference](https://api.example.com)
- [Tutorial Videos](https://videos.example.com)
- [Community Forum](https://forum.example.com)

![Logo](https://via.placeholder.com/150x75/333333/ffffff?text=Logo)`
    }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Text Processor Testing
          </h1>
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={() => setDarkMode(!darkMode)}
              variant={darkMode ? "secondary" : "default"}
            >
              Toggle {darkMode ? 'Light' : 'Dark'} Mode
            </Button>
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
            >
              Back to Chat
            </Button>
          </div>
        </header>

        {/* Markdown Link Test */}
        <MarkdownTestComponent isDarkMode={darkMode} />

        {/* Enhanced Image Test */}
        <ImageTestComponent isDarkMode={darkMode} />

        <div className="space-y-8">
          {testPatterns.map((pattern, index) => (
            <div 
              key={index} 
              className={`border rounded-lg p-6 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <h2 className={`text-xl font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {pattern.title}
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Raw Content */}
                <div>
                  <h3 className={`text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Raw Content:
                  </h3>
                  <pre className={`text-xs p-3 rounded border overflow-auto ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-600 text-gray-300' 
                      : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}>
                    {pattern.content}
                  </pre>
                </div>

                {/* Processed Content */}
                <div>
                  <h3 className={`text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Processed Output:
                  </h3>
                  <div className={`p-3 rounded border min-h-24 ${
                    darkMode 
                      ? 'bg-gray-900 border-gray-600' 
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <TextProcessor 
                      content={pattern.content}
                      isDarkMode={darkMode}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-8 p-4 rounded-lg ${
          darkMode ? 'bg-gray-800 text-gray-300' : 'bg-blue-50 text-gray-700'
        }`}>
          <h3 className="font-semibold mb-2">Testing Results:</h3>
          <ul className="list-disc ml-6 space-y-1 text-sm">
            <li>✅ Markdown text links render as clickable text (no raw symbols)</li>
            <li>✅ Markdown image links render as actual images</li>
            <li>✅ Modern file download components with icons and hover effects</li>
            <li>✅ HTML sanitization and safe rendering</li>
            <li>✅ Link processing with proper security attributes</li>
            <li>✅ Mixed HTML and Markdown content support</li>
            <li>✅ Dark mode styling support</li>
            <li>✅ Responsive design and overflow handling</li>
            <li>✅ Clean title processing for file links</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestFormatting;
