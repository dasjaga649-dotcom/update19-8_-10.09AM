import React from 'react';
import { Download, FileText, Image, Video, Music, Archive, File } from 'lucide-react';

interface FileLink {
  title: string;
  url: string;
}

interface ModernFileLinksProps {
  fileLinks: (string | FileLink)[];
  isDarkMode?: boolean;
}

const getFileIcon = (filename: string) => {
  const extension = filename.toLowerCase().split('.').pop() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return <Image className="w-5 h-5" />;
  }
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
    return <Video className="w-5 h-5" />;
  }
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
    return <Music className="w-5 h-5" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return <Archive className="w-5 h-5" />;
  }
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
    return <FileText className="w-5 h-5" />;
  }
  return <File className="w-5 h-5" />;
};

const cleanTitle = (title: string): string => {
  // Clean up common patterns in file titles
  return title
    .replace(/\s*\([^)]*\)\s*$/g, '') // Remove parenthetical text at end
    .replace(/\|\s*Hutech\s*Solutions.*$/i, '') // Remove "| Hutech Solutions" and everything after
    .replace(/\s*\|\s*/g, ' - ') // Replace pipes with dashes
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

const getFileSize = (url: string): string => {
  // This would typically come from the backend, but we can estimate or show generic
  const extension = url.toLowerCase().split('.').pop() || '';
  if (['pdf'].includes(extension)) return '~2.5 MB';
  if (['jpg', 'jpeg', 'png'].includes(extension)) return '~850 KB';
  if (['doc', 'docx'].includes(extension)) return '~1.2 MB';
  return '';
};

export const ModernFileLinks: React.FC<ModernFileLinksProps> = ({ 
  fileLinks, 
  isDarkMode = false 
}) => {
  if (!fileLinks || fileLinks.length === 0) return null;

  const validLinks = fileLinks.filter(
    (link) =>
      link &&
      (typeof link === 'string' || (typeof link === 'object' && link.url))
  );

  if (validLinks.length === 0) return null;

  return (
    <div className="mt-4">
      <div className={`mb-3 flex items-center gap-2 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">Downloads</span>
      </div>
      
      <div className="grid gap-3">
        {validLinks.map((link, index) => {
          const href = typeof link === 'string' ? link : link.url;
          const rawTitle = typeof link === 'string'
            ? link.split('/').pop() || `File ${index + 1}`
            : link.title;
          
          const title = cleanTitle(rawTitle);
          const fileSize = getFileSize(href);
          const icon = getFileIcon(href);

          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                isDarkMode
                  ? 'bg-gray-800/50 border-gray-700 hover:border-blue-500/50 hover:bg-gray-800'
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${
                isDarkMode ? 'bg-gradient-to-r from-blue-400 to-purple-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`} />
              
              <div className="relative p-4 flex items-center gap-4">
                {/* File Icon */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 text-blue-400 group-hover:bg-blue-500/20' 
                    : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                } transition-colors duration-300`}>
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm line-clamp-1 ${
                    isDarkMode 
                      ? 'text-gray-200 group-hover:text-blue-300' 
                      : 'text-gray-900 group-hover:text-blue-700'
                  } transition-colors duration-300`}>
                    {title}
                  </h4>
                  {fileSize && (
                    <p className={`text-xs mt-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {fileSize}
                    </p>
                  )}
                </div>

                {/* Download Icon */}
                <div className={`flex-shrink-0 p-1.5 rounded-full ${
                  isDarkMode 
                    ? 'text-gray-400 group-hover:text-blue-400 group-hover:bg-blue-500/20' 
                    : 'text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-100'
                } transition-all duration-300`}>
                  <Download className="w-4 h-4" />
                </div>
              </div>

              {/* Bottom shine effect */}
              <div className={`absolute bottom-0 left-0 right-0 h-px ${
                isDarkMode ? 'bg-gradient-to-r from-transparent via-blue-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-400/30 to-transparent'
              } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default ModernFileLinks;
