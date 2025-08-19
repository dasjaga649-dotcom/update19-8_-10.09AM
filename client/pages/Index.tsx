import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Mic,
  Image,
  Send,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";
import { StackedImageCarousel } from "../components/StackedImageCarousel";
import { HorizontalScrollableCards } from "../components/HorizontalScrollableCards";
import { AutoImageSlideshow } from "../components/AutoImageSlideshow";
import { Recommendations } from "../components/Recommendations";
import { parseMarkdownLinks, hasMarkdownLinks, hasBulletPoints } from "../lib/markdownUtils";

// Type definitions for the backend response
interface RelatedContent {
  image: string;
  title: string;
  url: string;
}

interface FileLink {
  title: string;
  url: string;
}

interface BackendResponse {
  response: {
    answer: string;
    file_links: (string | FileLink)[];
    recommendations: string[];
    related_content: RelatedContent[];
  };
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  response?: BackendResponse["response"];
}

const predefinedQuestions = [
  {
    category: "Founder/CEO",
    question: "Who is the founder/who is the CEO?",
    icon: "👤",
  },
  {
    category: "Offices",
    question: "Where are our offices?",
    icon: "����",
  },
  {
    category: "Services",
    question: "What services do we provide?",
    icon: "⚙️",
  },
  {
    category: "Industries",
    question: "What industries do we serve?",
    icon: "🏭",
  },
  {
    category: "Stats",
    question: "What are some impressive stats about Hutech?",
    icon: "📊",
  },
  {
    category: "Certifications",
    question: "What certifications do we have?",
    icon: "🏆",
  },
  {
    category: "Tech Stack",
    question: "What is our tech stack?",
    icon: "💻",
  },
  {
    category: "Contact",
    question: "Give me your contact details.",
    icon: "📞",
  },
];

export default function Index() {
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [voiceRecognition, setVoiceRecognition] = useState<any>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [showDotMenu, setShowDotMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState<string>("");
  const [showImages, setShowImages] = useState<{ [key: string]: boolean }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Cleanup voice recognition on component unmount
  useEffect(() => {
    return () => {
      if (voiceRecognition) {
        try {
          voiceRecognition.stop();
        } catch (error) {
          console.warn("Error stopping voice recognition on unmount:", error);
        }
      }
      if (recordingTimer) {
        clearTimeout(recordingTimer);
      }
    };
  }, [voiceRecognition, recordingTimer]);

  // Auto scroll to show above recommendations when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isConversationMode) {
      // Use requestAnimationFrame for smoother scrolling
      const scrollToShow = () => {
        requestAnimationFrame(() => {
          // Scroll to show content above the recommendations area (sticky bottom)
          if (chatContainerRef.current) {
            const container = chatContainerRef.current;
            const bottomOffset = 200; // Account for recommendations and input area
            container.scrollTop =
              container.scrollHeight - container.clientHeight + bottomOffset;
          }
        });
      };
      const timer = setTimeout(scrollToShow, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isConversationMode, recommendations]);

  // Additional scroll effect for new messages and typing to show above recommendations
  useEffect(() => {
    if (chatContainerRef.current && (isLoading || typingMessageId)) {
      const scrollToShow = () => {
        requestAnimationFrame(() => {
          const container = chatContainerRef.current;
          if (container) {
            const bottomOffset = 180; // Account for recommendations and input area
            container.scrollTop =
              container.scrollHeight - container.clientHeight + bottomOffset;
          }
        });
      };
      // Small delay to ensure content is rendered
      const timer = setTimeout(scrollToShow, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, typingMessageId, displayedText]);

  // Auto-scroll when images and content are shown
  useEffect(() => {
    if (messagesEndRef.current && Object.keys(showImages).length > 0) {
      const scrollToBottom = () => {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
      };
      // Delay to ensure images are loaded
      const timer = setTimeout(scrollToBottom, 200);
      return () => clearTimeout(timer);
    }
  }, [showImages]);

  const handleQuestionSubmit = async (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: question,
      timestamp: new Date(),
    };

    // Add user message first
    setMessages((prev) => [...prev, userMessage]);
    setIsConversationMode(true);

    // Then show AI thinking
    setIsLoading(true);

    try {
      // Make API call to backend
      const response = await fetch("http://localhost:3001/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BackendResponse = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "",
        timestamp: new Date(),
        response: data.response,
      };

      // Add the message immediately but start typing animation
      setMessages((prev) => [...prev, assistantMessage]);
      setRecommendations(data.response.recommendations || []);

      // Start typing animation for the response
      typeText(data.response.answer, assistantMessage.id, () => {
        // After typing is complete, speak the response
        speakWithElevenLabs(data.response.answer);
      });
    } catch (error) {
      console.error("Error calling backend API:", error);

      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "",
        timestamp: new Date(),
        response: {
          answer:
            "Sorry, I'm having trouble connecting to the backend service. Please check if the backend is running on http://localhost:3001/query and try again.",
          file_links: [],
          recommendations: [],
          related_content: [],
        },
      };

      setMessages((prev) => [...prev, errorMessage]);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      handleQuestionSubmit(inputValue);
      setInputValue("");
    }
  };

  // File upload handler
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Notification system
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
    showNotification("File uploaded successfully!", "success");
    setShowDotMenu(false);
    console.log("Uploaded files:", files);
  };

  // Image upload handler
  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
    showNotification("Image uploaded successfully!", "success");
    setShowDotMenu(false);
    console.log("Uploaded images:", files);
  };

  // Enhanced typing animation for bot responses with formatting support
  const typeText = (text: string, messageId: string, callback?: () => void) => {
    setTypingMessageId(messageId);
    setDisplayedText("");

    // Split text into words while preserving formatting
    const words = text.split(/\s+/);
    let currentWordIndex = 0;
    let displayText = "";

    const typeInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        // Add the current word
        if (currentWordIndex > 0) {
          displayText += " ";
        }
        displayText += words[currentWordIndex];

        setDisplayedText(displayText);
        currentWordIndex++;
      } else {
        clearInterval(typeInterval);
        setTypingMessageId(null);
        setDisplayedText("");
        // Show images for this message
        setShowImages((prev) => ({ ...prev, [messageId]: true }));
        if (callback) callback();
      }
    }, 80); // Faster typing - 80ms per word
  };

  // Helper function to render typing text with formatting and newline handling
  const renderTypingText = (text: string, isDarkMode: boolean = false) => {
    // First handle newlines, then bold formatting
    const lines = text.split(/\\n|\n/);

    return lines.map((line, lineIndex) => {
      // Split each line by ** markers for bold formatting
      const parts = line.split(/(\*\*.*?\*\*)/g);

      const formattedLine = parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          // Bold text
          const content = part.slice(2, -2);
          return (
            <strong
              key={index}
              className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              {content}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      });

      return (
        <div key={lineIndex} className="mb-1">
          {formattedLine}
        </div>
      );
    });
  };

  // Modern PDF download functionality
  const downloadChatAsPDF = () => {
    const currentDate = new Date();
    const formatDate = currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create modern HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Hutech AI Assistant - Chat History</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              min-height: 100vh;
              padding: 20px;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
              color: white;
              padding: 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              opacity: 0.3;
            }
            .header-content { position: relative; z-index: 1; }
            .logo-section { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px; }
            .logo { height: 40px; filter: brightness(0) invert(1); }
            .company-name { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .subtitle { font-size: 16px; opacity: 0.9; margin-bottom: 20px; }
            .date-info {
              background: rgba(255, 255, 255, 0.15);
              padding: 12px 24px;
              border-radius: 50px;
              display: inline-block;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .content { padding: 40px; }
            .chat-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 40px;
            }
            .stat-card {
              background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              padding: 20px;
              border-radius: 12px;
              text-align: center;
              border: 1px solid #e2e8f0;
            }
            .stat-number { font-size: 24px; font-weight: 700; color: #1e40af; }
            .stat-label { font-size: 14px; color: #64748b; margin-top: 4px; }
            .message {
              margin: 30px 0;
              display: flex;
              gap: 15px;
              align-items: flex-start;
            }
            .user-message { flex-direction: row-reverse; }
            .message-avatar {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 14px;
              flex-shrink: 0;
            }
            .user-avatar {
              background: linear-gradient(135deg, #3b82f6, #8b5cf6);
              color: white;
            }
            .ai-avatar {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
            }
            .message-bubble {
              max-width: 70%;
              padding: 20px;
              border-radius: 20px;
              position: relative;
              word-wrap: break-word;
            }
            .user-bubble {
              background: linear-gradient(135deg, #3b82f6, #8b5cf6);
              color: white;
              border-bottom-right-radius: 8px;
            }
            .assistant-bubble {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              color: #1f2937;
              border-bottom-left-radius: 8px;
            }
            .message-content { margin-bottom: 8px; }
            .timestamp {
              font-size: 11px;
              opacity: 0.7;
              text-align: right;
              margin-top: 8px;
            }
            .user-bubble .timestamp { color: rgba(255, 255, 255, 0.8); }
            .assistant-bubble .timestamp { color: #64748b; }
            .page-footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 14px;
            }
            .footer-logo {
              height: 24px;
              opacity: 0.7;
              margin: 0 10px;
              vertical-align: middle;
            }
            @media print {
              body { background: white; padding: 0; }
              .container { box-shadow: none; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-content">
                <div class="logo-section">
                  <svg class="logo" viewBox="0 0 100 30" fill="currentColor">
                    <rect x="0" y="10" width="20" height="10" rx="2"/>
                    <rect x="25" y="5" width="20" height="20" rx="3"/>
                    <rect x="50" y="8" width="20" height="14" rx="2"/>
                    <text x="75" y="20" font-size="12" font-weight="bold">HUTECH</text>
                  </svg>
                </div>
                <h1 class="company-name">Hutech Solutions</h1>
                <p class="subtitle">AI Assistant Chat History</p>
                <div class="date-info">Generated on ${formatDate}</div>
              </div>
            </div>

            <div class="content">
              <div class="chat-stats">
                <div class="stat-card">
                  <div class="stat-number">${messages.length}</div>
                  <div class="stat-label">Total Messages</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${messages.filter((m) => m.type === "user").length}</div>
                  <div class="stat-label">User Messages</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${messages.filter((m) => m.type === "assistant").length}</div>
                  <div class="stat-label">AI Responses</div>
                </div>
              </div>

              ${messages
                .map(
                  (msg) => `
                <div class="message ${msg.type}-message">
                  <div class="message-avatar ${msg.type === "user" ? "user-avatar" : "ai-avatar"}">
                    ${msg.type === "user" ? "U" : "AI"}
                  </div>
                  <div class="message-bubble ${msg.type}-bubble">
                    <div class="message-content">
                      ${msg.type === "user" ? msg.content : msg.response?.answer || msg.content}
                    </div>
                    <div class="timestamp">${msg.timestamp.toLocaleString()}</div>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>

            <div class="page-footer">
              <p>
                Powered by Hutech Solutions AI Assistant ���
                CMMI Level 3 Certified •
                Generated: ${currentDate.toISOString()}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Hutech-AI-Chat-${new Date().toISOString().split("T")[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification("Modern chat history downloaded!", "success");
    setShowDotMenu(false);
  };

  // Clear chat with confirmation (keeps messages in localStorage)
  const clearChatHistory = () => {
    // Save current messages to history before clearing
    setChatHistory((prev) => [...prev, ...messages]);
    setMessages([]);
    setRecommendations([]);
    setShowClearConfirm(false);
    setShowDotMenu(false);
    showNotification("History cleared successfully!", "error");
    // Keep messages in localStorage, just clear current session
    localStorage.setItem("allChatMessages", JSON.stringify([]));
  };

  // Load all messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("allChatMessages");
    if (savedMessages) {
      const allMessages = JSON.parse(savedMessages);
      setMessages(allMessages);

      // Initialize showImages for all existing messages (they should show images immediately)
      const imageState: { [key: string]: boolean } = {};
      allMessages.forEach((msg: Message) => {
        if (msg.type === "assistant") {
          imageState[msg.id] = true;
        }
      });
      setShowImages(imageState);
    }
  }, []);

  // Save all messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length >= 0) {
      localStorage.setItem("allChatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Close dot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDotMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest(".dot-menu-container")) {
          setShowDotMenu(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDotMenu]);

  // Enhanced voice recording with auto-search and improved error handling
  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      if (recordingTimer) {
        clearTimeout(recordingTimer);
        setRecordingTimer(null);
      }
      if (voiceRecognition) {
        try {
          voiceRecognition.stop();
        } catch (error) {
          console.warn("Error stopping speech recognition:", error);
        }
        setVoiceRecognition(null);
      }
    } else {
      // Start recording
      try {
        // Clean up any existing recognition first
        if (voiceRecognition) {
          try {
            voiceRecognition.stop();
          } catch (error) {
            console.warn("Error stopping existing recognition:", error);
          }
          setVoiceRecognition(null);
        }

        // Check if speech recognition is supported
        if (
          !("webkitSpeechRecognition" in window) &&
          !("SpeechRecognition" in window)
        ) {
          alert("Speech recognition not supported in this browser");
          return;
        }

        // Request microphone permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permissionError) {
          alert("Microphone permission is required for voice input");
          return;
        }

        setIsRecording(true);

        const SpeechRecognition =
          (window as any).webkitSpeechRecognition ||
          (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();

        // Configure recognition
        recognition.continuous = false; // Change to false for better stability
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.maxAlternatives = 1;

        let finalTranscript = "";
        let interimTranscript = "";

        recognition.onstart = () => {
          console.log("Speech recognition started");
        };

        recognition.onresult = (event: any) => {
          interimTranscript = "";
          finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Update input with interim or final results
          setInputValue(finalTranscript + interimTranscript);
        };

        recognition.onend = () => {
          console.log("Speech recognition ended");
          setIsRecording(false);
          setVoiceRecognition(null);

          // If we have a final transcript, process it
          if (finalTranscript.trim()) {
            handleQuestionSubmit(finalTranscript.trim());
            setInputValue("");
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          setVoiceRecognition(null);

          // Clear any timers
          if (recordingTimer) {
            clearTimeout(recordingTimer);
            setRecordingTimer(null);
          }

          // Handle specific error types
          switch (event.error) {
            case "aborted":
              console.log("Speech recognition was aborted");
              break;
            case "audio-capture":
              alert(
                "No microphone was found. Please check your microphone settings.",
              );
              break;
            case "not-allowed":
              alert(
                "Microphone permission was denied. Please allow microphone access.",
              );
              break;
            case "network":
              alert("Network error occurred during speech recognition.");
              break;
            case "no-speech":
              console.log("No speech was detected");
              break;
            case "service-not-allowed":
              alert("Speech recognition service is not allowed.");
              break;
            default:
              console.log("Speech recognition error:", event.error);
          }
        };

        // Set auto-stop timer (10 seconds max)
        const autoStopTimer = setTimeout(() => {
          if (recognition && isRecording) {
            try {
              recognition.stop();
            } catch (error) {
              console.warn("Error auto-stopping recognition:", error);
            }
          }
        }, 10000);

        setRecordingTimer(autoStopTimer);
        recognition.start();
        setVoiceRecognition(recognition);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsRecording(false);
        alert("Failed to start speech recognition. Please try again.");
      }
    }
  };

  // ElevenLabs text-to-speech function
  const speakWithElevenLabs = async (text: string) => {
    // You'll need to add your ElevenLabs API key and voice ID
    const ELEVENLABS_API_KEY = "your_api_key_here";
    const VOICE_ID = "your_voice_id_here";

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        },
      );

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error("ElevenLabs TTS error:", error);
    }
  };

  // Function to detect image URLs in text
  const detectImageUrls = (text: string): string[] => {
    const imageRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi;
    return text.match(imageRegex) || [];
  };

  // Function to clean up link text for better display
  const cleanLinkText = (text: string): string => {
    // Remove parenthetical text and extra information
    let cleaned = text
      .replace(/\s*\([^)]*\)\s*$/g, "") // Remove anything in parentheses at the end
      .replace(/\|\s*Hutech\s*Solutions.*$/i, "") // Remove "| Hutech Solutions" and everything after
      .replace(
        /Brochures\s*\|\s*Hutech\s*Solutions/gi,
        "Brochures - Hutech Solutions",
      ) // Clean up title format
      .replace(/\s*\|\s*/g, " - ") // Replace pipes with dashes
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\s*Brochure$/, " Brochure") // Ensure "Brochure" is properly spaced
      .trim();

    // If the text is still too long or repetitive, use a simpler version
    if (
      cleaned.length > 60 ||
      cleaned.includes("Hutech SolutionsHutech Solutions")
    ) {
      if (cleaned.toLowerCase().includes("brochure")) {
        // Extract just the brochure name without company suffix
        const brochureName = cleaned
          .replace(/\s*-\s*Hutech\s*Solutions.*$/i, "")
          .trim();
        if (brochureName.length > 0) {
          cleaned = brochureName;
        } else {
          cleaned = "Brochures - Hutech Solutions";
        }
      } else if (cleaned.toLowerCase().includes("service")) {
        cleaned = "Services - Hutech Solutions";
      } else {
        // Extract the first meaningful part
        const parts = cleaned.split(/[\-\|]/);
        cleaned = parts[0].trim();
      }
    }

    return cleaned;
  };

  // Function to safely render HTML content or format markdown
  const renderHTMLContent = (content: string, isDarkMode: boolean = false) => {
    // Check if content contains HTML tags
    const hasHTMLTags = /<[^>]+>/.test(content);

    if (hasHTMLTags) {
      // If content has HTML, sanitize and render safely
      // Enhanced sanitization - only allow safe tags
      let safeHTML = content
        .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "") // Remove iframe tags
        .replace(/javascript:/gi, "") // Remove javascript: URLs
        .replace(/on\w+="[^"]*"/gi, "") // Remove event handlers
        .replace(/on\w+='[^']*'/gi, "") // Remove event handlers
        // Enhance image tags with proper styling
        .replace(
          /<img([^>]*?)>/gi,
          '<img$1 style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;">',
        )
        // Add proper target and rel attributes to links
        .replace(
          /<a([^>]*?)href="([^"]*)"([^>]*?)>/gi,
          '<a$1href="$2"$3 target="_blank" rel="noopener noreferrer">',
        )
        // Enhance headings with proper spacing
        .replace(/<h([1-6])([^>]*?)>/gi, '<h$1$2 style="margin: 16px 0 8px 0; font-weight: bold;">')
        // Enhance paragraphs with proper spacing
        .replace(/<p([^>]*?)>/gi, '<p$1 style="margin: 8px 0; line-height: 1.6;">')
        // Enhance lists with proper spacing
        .replace(/<ul([^>]*?)>/gi, '<ul$1 style="margin: 8px 0; padding-left: 20px;">')
        .replace(/<ol([^>]*?)>/gi, '<ol$1 style="margin: 8px 0; padding-left: 20px;">')
        .replace(/<li([^>]*?)>/gi, '<li$1 style="margin: 4px 0;">');

      // Clean up link text in HTML content
      safeHTML = safeHTML.replace(
        /<a([^>]*)>([^<]+)<\/a>/gi,
        (match, attributes, linkText) => {
          const cleanedText = cleanLinkText(linkText);
          return `<a${attributes}>${cleanedText}</a>`;
        },
      );

      return (
        <div
          className={`prose prose-sm max-w-none ${isDarkMode ? "prose-invert" : ""}`}
          style={{
            // Custom styles for links, lists, and other elements
            "--tw-prose-links": isDarkMode ? "#60a5fa" : "#2563eb",
            "--tw-prose-bold": isDarkMode ? "#ffffff" : "#111827",
            "--tw-prose-headings": isDarkMode ? "#ffffff" : "#111827",
            "--tw-prose-body": isDarkMode ? "#e5e7eb" : "#374151",
          }}
          dangerouslySetInnerHTML={{ __html: safeHTML }}
        />
      );
    } else {
      // If no HTML tags, process as markdown/plain text
      return formatAnswerText(content, isDarkMode);
    }
  };

  // Function to format answer text with HTML support, bold text, and extract images
  const formatAnswerText = (text: string, isDarkMode: boolean = false) => {
    let processedText = text;
    const images: string[] = [];
    const slideshowImages: Array<{ url: string; title: string }> = [];
    const pageLinks: Array<{ title: string; url: string }> = [];
    const inlineLinks: Array<{ text: string; url: string; fullMatch: string }> =
      [];

    // Extract markdown page links [Title](URL) - but not images
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const markdownLinks = Array.from(processedText.matchAll(markdownLinkRegex));
    markdownLinks.forEach((match) => {
      const title = match[1];
      const url = match[2];
      // Check if it's not an image link
      if (!url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) {
        // Don't add to pageLinks (to avoid duplicates below)
        // Instead, store as inline links for proper rendering
        inlineLinks.push({ text: title, url: url, fullMatch: match[0] });
      }
    });

    // Extract markdown images and collect URLs with titles
    const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const markdownImages = Array.from(
      processedText.matchAll(markdownImageRegex),
    );
    markdownImages.forEach((match) => {
      const title =
        match[1] ||
        (typeof match[2] === "string"
          ? match[2].split("/").pop()?.split(".")[0]
          : "") ||
        "Image";
      images.push(match[2]); // URL from markdown
      slideshowImages.push({
        url: match[2],
        title: title,
      });
      processedText = processedText.replace(match[0], ""); // Remove markdown syntax
    });

    // Extract regular image URLs
    const regularImageUrls = detectImageUrls(processedText);
    images.push(...regularImageUrls);

    // Add regular URLs to slideshow as well
    regularImageUrls.forEach((url) => {
      const title =
        (typeof url === "string" ? url.split("/").pop()?.split(".")[0] : "") ||
        "Image";
      slideshowImages.push({
        url: url,
        title: title,
      });
    });

    // Fix malformed HTML tags
    processedText = processedText.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    processedText = processedText.replace(/&amp;/g, "&");
    processedText = processedText.replace(/&quot;/g, '"');
    processedText = processedText.replace(/&#39;/g, "'");

    // Fix malformed list items like <li><li> to proper <li>
    processedText = processedText.replace(/<li><li>/g, "<li>");
    processedText = processedText.replace(/<\/li><\/li>/g, "</li>");

    // Fix nested HTML tags
    processedText = processedText.replace(/<p><p>/g, "<p>");
    processedText = processedText.replace(/<\/p><\/p>/g, "</p>");

    // Handle HTML lists first
    let formattedContent: JSX.Element[] = [];

    // Check if text contains HTML list tags
    if (
      processedText.includes("<ul>") ||
      processedText.includes("<ol>") ||
      processedText.includes("<li>")
    ) {
      // Split by HTML list blocks
      const parts = processedText.split(/(<\/?(?:ul|ol|li)[^>]*>)/gi);
      let currentList: JSX.Element[] = [];
      let isInList = false;
      let listType = "";
      let listIndex = 0;

      parts.forEach((part, index) => {
        if (part.toLowerCase().includes("<ul")) {
          isInList = true;
          listType = "ul";
        } else if (part.toLowerCase().includes("<ol")) {
          isInList = true;
          listType = "ol";
        } else if (
          part.toLowerCase().includes("</ul>") ||
          part.toLowerCase().includes("</ol>")
        ) {
          if (currentList.length > 0) {
            formattedContent.push(
              <div key={`list-${listIndex++}`} className="mb-4 max-w-full">
                {listType === "ul" ? (
                  <ul className="list-none space-y-2 break-words">
                    {currentList}
                  </ul>
                ) : (
                  <ol className="list-none space-y-2 break-words">
                    {currentList}
                  </ol>
                )}
              </div>,
            );
            currentList = [];
          }
          isInList = false;
          listType = "";
        } else if (part.toLowerCase().includes("<li>")) {
          // Skip the opening li tag
        } else if (part.toLowerCase().includes("</li>")) {
          // Skip the closing li tag
        } else if (isInList && part.trim()) {
          // Process list item content
          const processedLine = part
            .split(/(\*\*[^*]+\*\*)/)
            .map((segment, segIndex) => {
              if (
                segment &&
                segment.startsWith &&
                segment.startsWith("**") &&
                segment.endsWith("**")
              ) {
                return (
                  <strong
                    key={segIndex}
                    className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {segment.slice(2, -2)}
                  </strong>
                );
              }
              return segment || "";
            });

          currentList.push(
            <li
              key={`item-${index}`}
              className={`flex items-start ${darkMode ? "text-gray-100" : "text-gray-700"} break-words`}
            >
              <span className="text-blue-600 mr-2 mt-1 flex-shrink-0">•</span>
              <span className="break-words overflow-wrap-anywhere">
                {processedLine}
              </span>
            </li>,
          );
        } else if (!isInList && part.trim()) {
          // Regular text outside of lists
          const lines = part.split(/\\n|\n/).filter((line) => line.trim());
          lines.forEach((line, lineIndex) => {
            const processedLine = line
              .split(/(\*\*[^*]+\*\*)/)
              .map((segment, segIndex) => {
                if (
                  segment &&
                  segment.startsWith &&
                  segment.startsWith("**") &&
                  segment.endsWith("**")
                ) {
                  return (
                    <strong
                      key={segIndex}
                      className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {segment.slice(2, -2)}
                    </strong>
                  );
                }
                return segment || "";
              });

            formattedContent.push(
              <div
                key={`text-${index}-${lineIndex}`}
                className={`mb-2 ${darkMode ? "text-gray-100" : "text-gray-700"} break-words overflow-wrap-anywhere`}
              >
                {processedLine}
              </div>,
            );
          });
        }
      });
    } else {
      // First, split text by * ** pattern to create bullet points
      const bulletSplitText = processedText.replace(/\s*\*\s*\*\*/g, '\n* **');
      const lines = bulletSplitText.split(/\\n|\n/).filter((line) => line.trim());

      lines.forEach((line, index) => {
        // Handle special bullet points: * **text**
        if (line.trim().match(/^\*\s*\*\*/)) {
          // Extract everything after * ** including the bold part and any text after
          const content = line.trim().replace(/^\*\s*\*\*/, '');

          // Process the content to handle bold formatting
          const processedContent = content
            .split(/(\*\*.*?\*\*)/)
            .map((segment, segIndex) => {
              if (
                segment &&
                segment.startsWith &&
                segment.startsWith("**") &&
                segment.endsWith("**")
              ) {
                return (
                  <strong
                    key={segIndex}
                    className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {segment.slice(2, -2)}
                  </strong>
                );
              }
              return segment || "";
            });

          formattedContent.push(
            <div
              key={index}
              className={`mb-2 ${darkMode ? "text-gray-100" : "text-gray-700"} ml-4 flex items-start break-words`}
            >
              <span className="text-blue-600 mr-2 mt-1 flex-shrink-0">•</span>
              <span className="break-words overflow-wrap-anywhere">
                {processedContent}
              </span>
            </div>,
          );
          return;
        }

        // Handle regular list items
        if (
          line.trim().startsWith("•") ||
          line.trim().startsWith("-") ||
          line.trim().match(/^\d+\./)
        ) {
          const listContent = line.replace(/^[��\-\d\.]\s*/, "");
          const processedLine = listContent
            .split(/(\*\*.*?\*\*)/)
            .map((segment, segIndex) => {
              if (
                segment &&
                segment.startsWith &&
                segment.startsWith("**") &&
                segment.endsWith("**")
              ) {
                return (
                  <strong
                    key={segIndex}
                    className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {segment.slice(2, -2)}
                  </strong>
                );
              }
              return segment || "";
            });

          formattedContent.push(
            <div
              key={index}
              className={`mb-2 ${darkMode ? "text-gray-100" : "text-gray-700"} ml-4 flex items-start break-words`}
            >
              <span className="text-blue-600 mr-2 mt-1 flex-shrink-0">•</span>
              <span className="break-words overflow-wrap-anywhere">
                {processedLine}
              </span>
            </div>,
          );
          return;
        }

        // Handle bold text and inline links
        const processedLine = line
          .split(/(\*\*.*?\*\*|\[([^\]]+)\]\(([^)]+)\))/)
          .map((segment, segIndex) => {
            // Add safety check for undefined segments
            if (!segment) return "";

            if (
              segment.startsWith &&
              segment.startsWith("**") &&
              segment.endsWith("**")
            ) {
              return (
                <strong
                  key={segIndex}
                  className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  {segment.slice(2, -2)}
                </strong>
              );
            }
            // Handle markdown links inline
            if (segment.match) {
              const linkMatch = segment.match(/\[([^\]]+)\]\(([^)]+)\)/);
              if (linkMatch) {
                const linkText = linkMatch[1];
                const linkUrl = linkMatch[2];
                // Check if it's not an image link
                if (!linkUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) {
                  const cleanedText = cleanLinkText(linkText);
                  return (
                    <a
                      key={segIndex}
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      {cleanedText}
                    </a>
                  );
                }
              }
            }
            return segment;
          });

        formattedContent.push(
          <div
            key={index}
            className={`mb-2 ${darkMode ? "text-gray-100" : "text-gray-700"} break-words overflow-wrap-anywhere`}
          >
            {processedLine}
          </div>,
        );
      });
    }

    return {
      formattedText: formattedContent,
      images: images,
      slideshowImages: slideshowImages,
      pageLinks: [], // Empty to avoid duplicate links since we handle them inline now
      inlineLinks: inlineLinks,
    };
  };

  // Page Links Component
  const PageLinks = ({
    links,
  }: {
    links: Array<{ title: string; url: string }>;
  }) => {
    if (links.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all duration-200 group"
          >
            <div className="flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-600 flex-shrink-0"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="text-blue-700 group-hover:text-blue-800 font-medium text-sm">
                {link.title} - {link.url}
              </span>
            </div>
          </a>
        ))}
      </div>
    );
  };

  // Image Carousel Component
  const ImageCarousel = ({ images }: { images: string[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (images.length === 0) return null;
    if (images.length === 1) {
      return (
        <div className="mt-4 max-w-2xl">
          <img
            src={images[0]}
            alt="Response image"
            className="w-full h-auto max-h-[400px] object-contain rounded-lg border border-gray-200 shadow-sm"
            style={{ aspectRatio: "auto" }}
          />
        </div>
      );
    }

    const nextImage = () => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
      <div className="mt-4 relative max-w-2xl">
        <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <img
            src={images[currentIndex]}
            alt={`Response image ${currentIndex + 1}`}
            className="w-full h-auto max-h-[400px] object-contain transition-all duration-300"
            style={{ aspectRatio: "auto" }}
          />

          {/* Navigation Arrows */}
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 backdrop-blur-sm"
          >
            <ChevronRight size={20} />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail Navigation */}
        <div className="flex gap-2 mt-3 justify-center">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === currentIndex
                  ? "border-blue-500 scale-110"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const formatAnswer = (answer: string) => {
    return answer.split("\n").map((line, index) => {
      if (line.startsWith("• **") && line.includes(":**")) {
        const parts = line.split(":**");
        return (
          <div key={index} className="mb-2">
            <span className="font-semibold text-blue-600">
              {parts[0].replace("• **", "")}:
            </span>
            <span className="ml-2">{parts[1]}</span>
          </div>
        );
      } else if (line.startsWith("**") && line.endsWith(":**")) {
        return (
          <div key={index} className="font-bold text-gray-800 mt-4 mb-2">
            {line.replace(/\*\*/g, "")}
          </div>
        );
      } else if (line.startsWith("• ")) {
        return (
          <div key={index} className="ml-4 mb-1 text-gray-700">
            {line.replace("• ", "• ")}
          </div>
        );
      } else if (line.trim()) {
        return (
          <div key={index} className="mb-2 text-gray-700">
            {line}
          </div>
        );
      }
      return null;
    });
  };

  if (isConversationMode) {
    return (
      <div
        className={`h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} flex flex-col overflow-hidden`}
      >
        {/* Professional Navigation Bar */}
        <header className="bg-white shadow-lg flex-shrink-0 border-b border-gray-200">
          <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              {/* Logo Section */}
              <div className="flex items-center">
                <div className="flex items-center gap-2 sm:gap-4">
                  <img
                    src="https://hutechsolutions.com/wp-content/uploads/2024/08/hutech-logo-1.svg"
                    alt="Hutech Solutions"
                    className="h-8 sm:h-10 w-auto"
                  />
                  <img
                    src="https://hutechsolutions.com/wp-content/uploads/2024/08/cmmi-level3-logo.svg"
                    alt="CMMI Level 3"
                    className="h-6 sm:h-8 w-auto hidden sm:block"
                  />
                </div>
              </div>

              {/* Navigation Items */}
              <div className="hidden lg:block">
                <div className="ml-10 flex items-baseline space-x-6 xl:space-x-8">
                  <a
                    href="#"
                    className="text-gray-700 hover:text-blue-600 px-2 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Home
                  </a>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-blue-600 px-2 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Features
                  </a>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-blue-600 px-2 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Services
                  </a>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-blue-600 px-2 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    About
                  </a>
                  <a
                    href="#"
                    className="text-gray-700 hover:text-blue-600 px-2 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Contact
                  </a>
                </div>
              </div>

              {/* Right Side Items */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Chat Bot Button */}
                <button
                  className="text-gray-700 hover:text-blue-600 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center gap-1 sm:gap-2"
                  title="Chat Assistant Active"
                >
                  <svg
                    width="16"
                    height="16"
                    className="sm:w-[18px] sm:h-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M13 8H7" />
                    <path d="M17 12H7" />
                  </svg>
                  <span className="hidden sm:inline text-xs sm:text-sm font-medium">
                    Chat
                  </span>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                </button>
              </div>
            </div>
          </nav>
        </header>

        {/* Chat Messages - Scrollable Area - Responsive */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto py-4 sm:py-6 space-y-4 sm:space-y-6 relative scroll-smooth"
          style={{ scrollBehavior: "smooth", paddingBottom: "120px" }}
        >
          <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
            {/* Modern Voice Animation Overlay */}
            {isRecording && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gradient-to-br from-orange-500 via-blue-500 to-orange-600 rounded-3xl p-8 shadow-2xl">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      {/* Animated mic icon */}
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center animate-voicePulse">
                        <Mic size={40} className="text-blue-600" />
                      </div>
                      {/* Ripple effect */}
                      <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                      <div
                        className="absolute -inset-2 rounded-full border-2 border-white/20 animate-ping"
                        style={{ animationDelay: "0.5s" }}
                      ></div>
                      <div
                        className="absolute -inset-4 rounded-full border border-white/10 animate-ping"
                        style={{ animationDelay: "1s" }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-white text-xl font-semibold mb-2">
                        Listening...
                      </h3>
                      <p className="text-white/80 text-sm">
                        Speak clearly and I'll understand
                      </p>
                    </div>
                    {/* Sound waves animation */}
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-white/60 rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 30 + 10}px`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: "0.8s",
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setIsRecording(false)}
                      className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20"
                    >
                      Stop Listening
                    </button>
                  </div>
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} animate-fadeInUp mb-4`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`${message.type === "user" ? "max-w-xs ml-auto" : "max-w-2xl mr-auto"} ${message.type === "user" ? "bg-gray-200 text-gray-800 rounded-2xl rounded-br-md p-4" : "bg-transparent text-gray-900 p-2"}`}
                >
                  {message.type === "user" ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <div>
                      {/* 1. ANSWER SECTION - Show typing animation or complete answer */}
                      <div className="max-w-full overflow-hidden">
                        {(() => {
                          // Show typing animation if this message is currently being typed
                          if (typingMessageId === message.id && displayedText) {
                            return (
                              <div className="prose-sm text-gray-900">
                                <div className="whitespace-pre-wrap">
                                  {renderTypingText(displayedText, darkMode)}
                                </div>
                                <span className="animate-pulse text-blue-500">
                                  |
                                </span>
                              </div>
                            );
                          }

                          // Show complete message
                          const answer = message.response?.answer || "";

                          // Check if answer contains HTML tags
                          const hasHTMLTags = /<[^>]+>/.test(answer);

                          if (hasHTMLTags) {
                            // Render HTML content safely
                            return (
                              <div className="max-w-full break-words">
                                {renderHTMLContent(answer, darkMode)}
                              </div>
                            );
                          } else {
                            // Check if answer contains bullet points first
                            const hasBulletPointsInAnswer = hasBulletPoints(answer);
                            const hasMarkdownLinksinAnswer =
                              hasMarkdownLinks(answer);

                            if (hasBulletPointsInAnswer) {
                              // Process as text with bullet points
                              const formatted = formatAnswerText(answer, darkMode);
                              return (
                                <div>
                                  <div className={`prose-sm leading-relaxed max-w-full break-words ${
                                    darkMode ? "text-gray-100" : "text-gray-900"
                                  }`}>
                                    {formatted.formattedText}
                                  </div>
                                  {/* Display slideshow for extracted images - always show if available */}
                                  {(showImages[message.id] ||
                                    (typingMessageId !== message.id &&
                                      typingMessageId !== null) ||
                                    typingMessageId === null) &&
                                    formatted.slideshowImages &&
                                    formatted.slideshowImages.length > 0 && (
                                    <AutoImageSlideshow images={formatted.slideshowImages} />
                                  )}
                                </div>
                              );
                            } else if (hasMarkdownLinksinAnswer) {
                              // Parse and render markdown links
                              const parsedContent = parseMarkdownLinks(answer);
                              return (
                                <div
                                  className={`prose-sm leading-relaxed max-w-full break-words ${
                                    darkMode ? "text-gray-100" : "text-gray-900"
                                  }`}
                                >
                                  {parsedContent.map((part, index) => (
                                    <span key={index}>{part}</span>
                                  ))}
                                </div>
                              );
                            } else {
                              // Process as regular markdown/plain text
                              const formatted = formatAnswerText(
                                answer,
                                darkMode,
                              );
                              return (
                                <div>
                                  <div
                                    className={`prose-sm leading-relaxed max-w-full break-words ${
                                      darkMode
                                        ? "text-gray-100"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {formatted.formattedText}
                                  </div>
                                  {/* Display slideshow for extracted images - always show if available */}
                                  {(showImages[message.id] ||
                                    (typingMessageId !== message.id &&
                                      typingMessageId !== null) ||
                                    typingMessageId === null) &&
                                    formatted.slideshowImages &&
                                    formatted.slideshowImages.length > 0 && (
                                      <AutoImageSlideshow
                                        images={formatted.slideshowImages}
                                      />
                                    )}
                                </div>
                              );
                            }
                          }
                        })()}
                      </div>

                      {/* 2. RELATED CONTENT SECTION - Show after typing is complete */}
                      {(showImages[message.id] ||
                        (typingMessageId !== message.id &&
                          typingMessageId !== null) ||
                        typingMessageId === null) &&
                        message.response?.related_content &&
                        message.response.related_content.length > 0 && (
                          <HorizontalScrollableCards
                            content={message.response.related_content}
                            isDarkMode={darkMode}
                          />
                        )}

                      {/* 3. FILE LINKS SECTION - Small vertical cards */}
                      {(showImages[message.id] ||
                        (typingMessageId !== message.id &&
                          typingMessageId !== null) ||
                        typingMessageId === null) &&
                        message.response?.file_links &&
                        message.response.file_links.length > 0 && (
                          <div className="mt-4 max-h-40 overflow-y-auto scrollbar-hide">
                            <div className="space-y-2">
                              {message.response.file_links
                                .filter(
                                  (link) =>
                                    link &&
                                    (typeof link === "string" ||
                                      (typeof link === "object" && link.url)),
                                )
                                .map((link, index) => {
                                  // Handle both old format (string) and new format (object with title and url)
                                  const href =
                                    typeof link === "string" ? link : link.url;
                                  const title =
                                    typeof link === "string"
                                      ? link.split("/").pop() ||
                                        `File ${index + 1}`
                                      : link.title;

                                  return (
                                    <a
                                      key={index}
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`block p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
                                        darkMode
                                          ? "bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-700"
                                          : "bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                      }`}
                                    >
                                      <span
                                        className={`text-sm font-medium ${
                                          darkMode
                                            ? "text-gray-200 hover:text-blue-400"
                                            : "text-gray-700 hover:text-blue-600"
                                        }`}
                                      >
                                        {title}
                                      </span>
                                    </a>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                      {/* 4. RECOMMENDATIONS SECTION - Show after typing is complete */}
                      {(showImages[message.id] ||
                        (typingMessageId !== message.id &&
                          typingMessageId !== null) ||
                        typingMessageId === null) &&
                        message.response?.recommendations &&
                        message.response.recommendations.length > 0 && (
                          <div className="mt-4">
                            <Recommendations
                              recommendations={message.response.recommendations}
                              onSelect={handleQuestionSubmit}
                              isDarkMode={darkMode}
                            />
                          </div>
                        )}

                      {/* Show Hutech logo when no content is present */}
                      {(!message.response?.related_content ||
                        message.response.related_content.length === 0) &&
                        (!message.response?.file_links ||
                          message.response.file_links.length === 0) &&
                        (!message.response?.recommendations ||
                          message.response.recommendations.length === 0) && (
                          <div className="mt-4 flex items-center gap-2 opacity-70">
                            <img
                              src="https://hutechsolutions.com/wp-content/uploads/2024/08/hutech-logo-1.svg"
                              alt="Hutech Solutions"
                              className="h-6 w-auto"
                            />
                            <span className="text-xs text-gray-500">
                              Powered by Hutech AI
                            </span>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && !isTyping && (
              <div className="flex justify-start animate-fadeInUp mb-4">
                <div className="max-w-4xl mr-auto bg-transparent p-2">
                  <div className="bg-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      {/* Three gradient dots */}
                      <div className="flex gap-1">
                        <div className="w-3 h-3 thinking-dot-gradient rounded-full animate-bounce"></div>
                        <div
                          className="w-3 h-3 thinking-dot-gradient rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-3 h-3 thinking-dot-gradient rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-gray-700 font-medium text-sm">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} className="h-8" />
          </div>
        </div>

        {/* Confirmation Popup */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl p-6 max-w-sm mx-4 shadow-xl`}
            >
              <h3
                className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"} mb-2`}
              >
                Clear Chat History
              </h3>
              <p
                className={`${darkMode ? "text-gray-300" : "text-gray-600"} mb-4`}
              >
                Are you sure you want to clear all messages? This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className={`flex-1 px-4 py-2 ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} rounded-lg transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={clearChatHistory}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Image Input */}
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Sticky Input Bar with integrated recommendations */}
        <div
          className={`pb-3 sm:pb-4 flex-shrink-0 fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl ${darkMode ? "bg-gray-900/80" : "bg-white/80"}`}
        >
          <div className="max-w-4xl mx-auto relative px-3 sm:px-4">
            {/* File Upload Inputs (Hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-700 flex items-center gap-2"
                  >
                    <span>{file.name}</span>
                    <button
                      onClick={() =>
                        setUploadedFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Simplified Dot Menu */}
            {showDotMenu && (
              <div
                className={`dot-menu-container absolute bottom-20 right-6 ${darkMode ? "bg-gray-800 border-gray-600 shadow-2xl" : "bg-white border-gray-200 shadow-2xl"} rounded-2xl p-3 z-10 backdrop-blur-lg border`}
              >
                <button
                  onClick={() => {
                    setIsConversationMode(false);
                    setRecommendations([]);
                    setShowDotMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-blue-50"} rounded-xl flex items-center gap-3 transition-all duration-200 hover:scale-105`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  New Chat
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className={`w-full text-left px-4 py-3 text-sm ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-red-50"} rounded-xl flex items-center gap-3 transition-all duration-200 hover:scale-105`}
                >
                  <Trash2 size={16} />
                  Clear Chat
                </button>
                <button
                  onClick={downloadChatAsPDF}
                  className={`w-full text-left px-4 py-3 text-sm ${darkMode ? "text-green-400 hover:bg-gray-700" : "text-green-600 hover:bg-green-50"} rounded-xl flex items-center gap-3 transition-all duration-200 hover:scale-105`}
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            )}

            <div
              className={`flex items-center gap-2 sm:gap-3 ${darkMode ? "bg-gray-700" : "bg-gray-100"} rounded-full p-2 sm:p-3 transition-all duration-300 ${isLoading ? "" : `${darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"} hover:shadow-lg`} transform-gpu`}
            >
              {/* Left side - Voice only */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Voice button */}
                <button
                  onClick={handleVoiceInput}
                  className={`p-1.5 sm:p-2 transition-colors duration-200 ${
                    isRecording
                      ? "text-blue-600 animate-voicePulse"
                      : `${darkMode ? "text-gray-400 hover:text-blue-400" : "text-gray-500 hover:text-blue-600"}`
                  }`}
                  title="Voice input"
                >
                  <Mic size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Input field with enhanced animation */}
              <div className="flex-1 relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Sparkles size={16} className="animate-spin" />
                      <span className="text-sm animate-pulse">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                )}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleInputSubmit()}
                  placeholder={
                    isRecording
                      ? "🎤 Listening..."
                      : isLoading
                        ? ""
                        : "✨ Ask me anything..."
                  }
                  disabled={isLoading || isRecording}
                  className={`w-full bg-transparent outline-none transition-all duration-300 text-sm sm:text-base ${isLoading ? "opacity-50" : "opacity-100"} ${darkMode ? "text-white placeholder-gray-400" : "text-gray-800 placeholder-gray-500"} disabled:opacity-50`}
                />
              </div>

              {/* Right side controls */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Dark mode toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-1.5 sm:p-2 ${darkMode ? "text-gray-400 hover:text-blue-400" : "text-gray-500 hover:text-blue-600"} transition-colors duration-200`}
                  title="Toggle dark mode"
                >
                  {darkMode ? (
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                  ) : (
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>

                {/* Dot menu */}
                <button
                  onClick={() => setShowDotMenu(!showDotMenu)}
                  className={`p-1.5 sm:p-2 ${darkMode ? "text-gray-400 hover:text-blue-400" : "text-gray-500 hover:text-blue-600"} transition-colors duration-200`}
                  title="More options"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>

                {/* Send button with enhanced animation */}
                <button
                  onClick={handleInputSubmit}
                  disabled={isLoading || !inputValue.trim() || isRecording}
                  className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 transform ${
                    isLoading || isRecording
                      ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed"
                      : "hover:scale-110 active:scale-95 hover:shadow-lg"
                  } text-white disabled:opacity-50 disabled:hover:scale-100 shadow-md`}
                  style={{
                    backgroundColor:
                      isLoading || isRecording ? undefined : "#1192EE",
                  }}
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative">
                      <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <Send
                      size={14}
                      className="sm:w-4 sm:h-4 transform transition-transform duration-200"
                    />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {notification.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`h-screen overflow-hidden ${darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30"}`}
    >
      {/* Professional Navigation Bar */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="flex items-center gap-4">
                <img
                  src="https://hutechsolutions.com/wp-content/uploads/2024/08/hutech-logo-1.svg"
                  alt="Hutech Solutions"
                  className="h-10 w-auto"
                />
                <img
                  src="https://hutechsolutions.com/wp-content/uploads/2024/08/cmmi-level3-logo.svg"
                  alt="CMMI Level 3"
                  className="h-8 w-auto"
                />
              </div>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a
                  href="#"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Home
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Features
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Services
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  About
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Contact
                </a>
              </div>
            </div>

            {/* Right Side Items */}
            <div className="flex items-center space-x-4">
              {/* Chat Bot Button */}
              <button
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                title="Open Chat Assistant"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M13 8H7" />
                  <path d="M17 12H7" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">
                  Chat
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-4 py-3 overflow-hidden max-h-[calc(100vh-140px)]">
        {/* Greeting Section */}
        <div className="text-center mb-6">
          <h2
            className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"} mb-2`}
          >
            Hello, this is an{" "}
            <span
              className="font-extrabold bg-gradient-to-r from-[#1192EE] via-[#1192EE] to-[#FF9D00] bg-clip-text text-transparent"
              style={{
                background: "linear-gradient(45deg, #1192EE 10%, #FF9D00 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI assistant!
            </span>
          </h2>
          <p
            className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} max-w-xl mx-auto`}
          >
            I will help you find answers to your questions. Here are some
            examples.
          </p>
        </div>

        {/* Question Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2 max-w-3xl w-full mx-auto">
          {predefinedQuestions.map((item, index) => (
            <button
              key={index}
              onClick={() => handleQuestionSubmit(item.question)}
              className={`${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 hover:border-blue-400 hover:from-gray-700 hover:to-gray-600" : "bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-300 hover:from-blue-50 hover:to-purple-50"} border rounded-lg p-2 hover:shadow-lg transition-all duration-300 text-left group transform hover:scale-105 animate-fadeInUp`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-base mb-1">{item.icon}</div>
              <h3
                className={`font-medium ${darkMode ? "text-white group-hover:text-blue-400" : "text-gray-800 group-hover:text-blue-600"} mb-1 text-xs leading-tight`}
              >
                {item.category}
              </h3>
              <p
                className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"} leading-tight line-clamp-2`}
              >
                {item.question}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Modern Voice Animation Overlay - Main Page */}
      {isRecording && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-orange-500 via-blue-500 to-orange-600 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                {/* Animated mic icon */}
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center animate-voicePulse">
                  <Mic size={40} className="text-blue-600" />
                </div>
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                <div
                  className="absolute -inset-2 rounded-full border-2 border-white/20 animate-ping"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <div
                  className="absolute -inset-4 rounded-full border border-white/10 animate-ping"
                  style={{ animationDelay: "1s" }}
                ></div>
              </div>
              <div className="text-center">
                <h3 className="text-white text-xl font-semibold mb-2">
                  Listening...
                </h3>
                <p className="text-white/80 text-sm">
                  Speak clearly and I'll understand
                </p>
              </div>
              {/* Sound waves animation */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white/60 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 30 + 10}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: "0.8s",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setIsRecording(false)}
                className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-200 backdrop-blur-sm border border-white/20"
              >
                Stop Listening
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Input Bar */}
      <div
        className={`pb-3 sm:pb-4 flex-shrink-0 fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl ${darkMode ? "bg-gray-900/80" : "bg-white/80"}`}
      >
        <div className="max-w-4xl mx-auto relative px-3 sm:px-4">
          {/* File Upload Inputs (Hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-700 flex items-center gap-2"
                >
                  <span>{file.name}</span>
                  <button
                    onClick={() =>
                      setUploadedFiles((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={`flex items-center gap-3 ${darkMode ? "bg-gray-700" : "bg-gray-50"} rounded-full p-3 transition-all duration-500 border ${darkMode ? "border-gray-600" : "border-gray-200"} shadow-sm ${isLoading ? "bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-blue-300 shadow-2xl scale-105 animate-pulse" : `${darkMode ? "hover:bg-gray-600 hover:border-gray-500" : "hover:bg-white hover:border-gray-300"} hover:shadow-lg`} transform-gpu`}
          >
            {/* Left side - Voice only */}
            <div className="flex items-center gap-2">
              {/* Voice button */}
              <button
                onClick={handleVoiceInput}
                className={`p-2 transition-colors duration-200 ${
                  isRecording
                    ? "text-blue-600 animate-voicePulse"
                    : `${darkMode ? "text-gray-400 hover:text-blue-400" : "text-gray-500 hover:text-blue-600"}`
                }`}
                title="Voice input"
              >
                <Mic size={16} />
              </button>
            </div>

            {/* Input field with enhanced styling */}
            <div className="flex-1 relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Sparkles size={16} className="animate-spin" />
                    <span className="text-sm animate-pulse">
                      AI is thinking...
                    </span>
                  </div>
                </div>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleInputSubmit()}
                placeholder={
                  isRecording
                    ? "🎤 Listening..."
                    : isLoading
                      ? ""
                      : "✨ Ask me anything..."
                }
                disabled={isLoading || isRecording}
                className={`w-full bg-transparent outline-none transition-all duration-300 ${isLoading ? "opacity-50" : "opacity-100"} ${darkMode ? "text-white placeholder-gray-400" : "text-gray-800 placeholder-gray-500"} disabled:opacity-50`}
              />
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 ${darkMode ? "text-gray-400 hover:text-blue-400" : "text-gray-500 hover:text-blue-600"} transition-colors duration-200`}
                title="Toggle dark mode"
              >
                {darkMode ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* Dot menu */}
              <button
                onClick={() => setShowDotMenu(!showDotMenu)}
                className={`p-2 ${darkMode ? "text-gray-400 hover:text-blue-400" : "text-gray-500 hover:text-blue-600"} transition-colors duration-200`}
                title="More options"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              {/* Send button with enhanced animation */}
              <button
                onClick={handleInputSubmit}
                disabled={isLoading || !inputValue.trim() || isRecording}
                className={`p-2 rounded-full transition-all duration-300 transform ${
                  isLoading || isRecording
                    ? "bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed"
                    : "hover:scale-110 active:scale-95 hover:shadow-lg"
                } text-white disabled:opacity-50 disabled:hover:scale-100 shadow-md`}
                style={{
                  backgroundColor:
                    isLoading || isRecording ? undefined : "#1192EE",
                }}
              >
                {isLoading ? (
                  <div className="w-4 h-4 relative">
                    <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <Send
                    size={16}
                    className="transform transition-transform duration-200"
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            notification.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}
