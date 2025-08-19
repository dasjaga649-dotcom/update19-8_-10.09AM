import React from "react";

/**
 * Utility function to parse markdown links [text](url) and convert them to JSX elements
 */
export const parseMarkdownLinks = (
  text: string,
): (string | React.ReactElement)[] => {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the link as JSX element
    const linkText = match[1];
    const linkUrl = match[2];

    parts.push(
      React.createElement(
        "a",
        {
          key: `link-${match.index}`,
          href: linkUrl,
          target: "_blank",
          rel: "noopener noreferrer",
          className:
            "text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200",
        },
        linkText,
      ),
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last link
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

/**
 * Check if text contains markdown links
 */
export const hasMarkdownLinks = (text: string): boolean => {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  return markdownLinkRegex.test(text);
};

/**
 * Check if text contains bullet points with bold text
 */
export const hasBulletPoints = (text: string): boolean => {
  return /\*\s*\*\*/.test(text);
};
