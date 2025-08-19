import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import DOMPurify from 'dompurify';

interface TextProcessorProps {
  content: string;
  isDarkMode?: boolean;
  className?: string;
}

interface ProcessedContent {
  formattedContent: React.ReactElement;
  extractedImages: string[];
  extractedLinks: Array<{ title: string; url: string }>;
}

export const TextProcessor: React.FC<TextProcessorProps> = ({ 
  content, 
  isDarkMode = false, 
  className = '' 
}) => {
  const processedContent = React.useMemo(() => processContent(content, isDarkMode), [content, isDarkMode]);

  return (
    <div className={`text-processor ${className}`}>
      {processedContent.formattedContent}
    </div>
  );
};

export const processContent = (content: string, isDarkMode: boolean = false): ProcessedContent => {
  const extractedImages: string[] = [];
  const extractedLinks: Array<{ title: string; url: string }> = [];

  // Extract images first
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let imageMatch;
  while ((imageMatch = imageRegex.exec(content)) !== null) {
    extractedImages.push(imageMatch[2]);
  }

  // Extract regular image URLs
  const urlImageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s]*)?)/gi;
  let urlImageMatch;
  while ((urlImageMatch = urlImageRegex.exec(content)) !== null) {
    if (!extractedImages.includes(urlImageMatch[1])) {
      extractedImages.push(urlImageMatch[1]);
    }
  }

  // Extract links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    // Skip if it's an image link
    const url = linkMatch[2];
    if (!url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) {
      extractedLinks.push({ title: linkMatch[1], url: linkMatch[2] });
    }
  }

  // Remove extracted images from content to avoid duplicate rendering
  let processedContent = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
  
  // Remove standalone image URLs that we've extracted
  extractedImages.forEach(img => {
    processedContent = processedContent.replace(new RegExp(img.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
  });

  // Clean up extra whitespace
  processedContent = processedContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

  // Check if content is HTML or markdown
  const isHTML = /<[^>]+>/.test(processedContent);

  let formattedContent: React.ReactElement;

  if (isHTML) {
    // Sanitize HTML content
    const sanitizedHTML = DOMPurify.sanitize(processedContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ALLOW_DATA_ATTR: false
    });

    formattedContent = (
      <div 
        className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''} ${
          isDarkMode 
            ? 'text-gray-100 [&_strong]:text-white [&_b]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white [&_a]:text-blue-400 [&_a:hover]:text-blue-300' 
            : 'text-gray-700 [&_strong]:text-gray-900 [&_b]:text-gray-900 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900 [&_a]:text-blue-600 [&_a:hover]:text-blue-800'
        } [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_a]:underline [&_a]:font-medium break-words overflow-wrap-anywhere`}
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    );
  } else {
    // Use ReactMarkdown for markdown content
    formattedContent = (
      <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''} ${
          isDarkMode
            ? 'text-gray-100 [&_strong]:text-white [&_b]:text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white [&_h6]:text-white [&_a]:text-blue-400 [&_a:hover]:text-blue-300'
            : 'text-gray-700 [&_strong]:text-gray-900 [&_b]:text-gray-900 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900 [&_a]:text-blue-600 [&_a:hover]:text-blue-800'
        } [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_a]:underline [&_a]:font-medium break-words overflow-wrap-anywhere`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
        components={{
          // Custom link component
          a: ({ href, children, ...props }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} underline font-medium transition-colors duration-200`}
              {...props}
            >
              {children}
            </a>
          ),
          // Custom image component
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt || 'Image'}
              className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm my-2"
              loading="lazy"
              {...props}
            />
          ),
          // Custom list styling
          ul: ({ children, ...props }) => (
            <ul className="list-disc ml-6 space-y-1 break-words" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal ml-6 space-y-1 break-words" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className={`${isDarkMode ? 'text-gray-100' : 'text-gray-700'} break-words overflow-wrap-anywhere`} {...props}>
              {children}
            </li>
          ),
          // Custom paragraph styling
          p: ({ children, ...props }) => (
            <p className={`mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'} leading-relaxed break-words overflow-wrap-anywhere`} {...props}>
              {children}
            </p>
          ),
          // Custom heading styling
          h1: ({ children, ...props }) => (
            <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} {...props}>
              {children}
            </h6>
          ),
          // Custom strong/bold styling
          strong: ({ children, ...props }) => (
            <strong className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} {...props}>
              {children}
            </strong>
          ),
          // Custom emphasis styling
          em: ({ children, ...props }) => (
            <em className={`italic ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`} {...props}>
              {children}
            </em>
          ),
          // Custom code styling
          code: ({ children, ...props }) => (
            <code className={`px-1 py-0.5 rounded text-sm font-mono ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`} {...props}>
              {children}
            </code>
          ),
          // Custom blockquote styling
          blockquote: ({ children, ...props }) => (
            <blockquote className={`border-l-4 pl-4 py-2 my-4 ${isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-200' : 'border-gray-300 bg-gray-50 text-gray-700'}`} {...props}>
              {children}
            </blockquote>
          )
        }}
      >
        {processedContent}
        </ReactMarkdown>
      </div>
    );
  }

  return {
    formattedContent,
    extractedImages,
    extractedLinks
  };
};

export default TextProcessor;
