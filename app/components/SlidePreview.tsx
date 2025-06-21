"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SlidePreviewProps {
  htmlContent: string;
  slideNumber: number;
  onContentChange?: (slideNumber: number, newHtmlContent: string) => void;
  editable?: boolean;
}

interface HTMLIFrameElementWithCleanup extends HTMLIFrameElement {
  cleanupListeners?: () => void;
}

export default function SlidePreview({
  htmlContent,
  slideNumber,
  onContentChange,
  editable = true,
}: SlidePreviewProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
  const parentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElementWithCleanup>(null);

  // Function to extract background color from HTML content
  const extractBackgroundColor = (html: string): string => {
    try {
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      // Look for background color in various places
      const body = tempDiv.querySelector("body");
      const htmlElement = tempDiv.querySelector("html");
      const rootDiv = tempDiv.querySelector("div");

      // Check body first, then html, then first div, then default to white
      const element = body || htmlElement || rootDiv || tempDiv;

      if (element) {
        const computedStyle = window.getComputedStyle(element);
        const bgColor =
          computedStyle.backgroundColor ||
          computedStyle.background ||
          element.style.backgroundColor ||
          element.style.background;

        if (
          bgColor &&
          bgColor !== "rgba(0, 0, 0, 0)" &&
          bgColor !== "transparent"
        ) {
          return bgColor;
        }
      }

      // Try to extract from inline styles or CSS
      const styleMatch = html.match(/background(?:-color)?\s*:\s*([^;]+)/i);
      if (styleMatch) {
        return styleMatch[1].trim();
      }

      // Try to extract from bgcolor attribute
      const bgColorMatch = html.match(/bgcolor\s*=\s*["']([^"']+)["']/i);
      if (bgColorMatch) {
        return bgColorMatch[1];
      }

      return "#ffffff"; // Default to white
    } catch (error) {
      console.warn("Error extracting background color:", error);
      return "#ffffff";
    }
  };

  // Function to apply scaling to iframe content
  const applyScaling = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    try {
      const firstChild = iframe.contentDocument.body.children[0] as HTMLElement;
      if (!firstChild) return;

      // Reset transform
      firstChild.style.transform = `scale(1)`;
      firstChild.style.transformOrigin = `left top`;
      iframe.contentDocument.body.style.overflow = "hidden";

      // Calculate ratios
      const heightRatio =
        firstChild.getBoundingClientRect().height /
        iframe.getBoundingClientRect().height;
      const widthRatio =
        firstChild.getBoundingClientRect().width /
        iframe.getBoundingClientRect().width;

      // Calculate scale
      const scaleStyle = `scale(${
        (1 / Math.max(heightRatio, widthRatio)) * 0.95
      })`;
      firstChild.style.transform = `${scaleStyle}`;
      // Apply scale and center the content
      const translateX =
        (iframe.getBoundingClientRect().width -
          firstChild.getBoundingClientRect().width) /
        2;
      const translateY =
        (iframe.getBoundingClientRect().height -
          firstChild.getBoundingClientRect().height) /
        2;

      firstChild.style.transform = `translate(${translateX}px, ${translateY}px) ${scaleStyle} `;
      setIsVisible(true);
    } catch (error) {
      console.warn("Error applying scaling:", error);
    }
  };

  // Function to handle content changes in the iframe
  const handleContentChange = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || !onContentChange) return;

    try {
      // Get the content from the iframe body
      const body = iframe.contentDocument.body;
      if (body) {
        // Extract the content excluding the body tag itself
        // We need to get the innerHTML of the body, which contains all the slide content
        const content = body.innerHTML;

        // Only update if content has actually changed and is not empty
        if (content !== htmlContent && content.trim() !== "") {
          onContentChange(slideNumber, content);
        }
      }
    } catch (error) {
      console.warn("Error handling content change:", error);
    }
  }, [onContentChange, slideNumber, htmlContent]);

  useEffect(() => {
    setIsVisible(false);
    // Extract background color when htmlContent changes
    const extractedColor = extractBackgroundColor(htmlContent);
    setBackgroundColor(extractedColor);
  }, [htmlContent]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Wait for iframe to load before applying scaling
    const handleLoad = () => {
      setTimeout(() => {
        applyScaling();

        // Add event listeners for content changes
        if (iframe.contentDocument && onContentChange && editable) {
          const body = iframe.contentDocument.body;
          if (body) {
            // Only save on blur - when user clicks elsewhere
            const blurHandler = () => {
              handleContentChange();
            };

            // Listen for blur events only
            body.addEventListener("blur", blurHandler);

            // Cleanup function for this iframe
            const cleanup = () => {
              body.removeEventListener("blur", blurHandler);
            };

            // Store cleanup function on iframe for later use
            iframe.cleanupListeners = cleanup;
          }
        }
      }, 0); // Small delay to ensure content is rendered
    };

    iframe.addEventListener("load", handleLoad);

    // Apply scaling after a short delay to ensure iframe content is ready
    const timer = setTimeout(() => {
      if (iframe.contentDocument?.readyState === "complete") {
        handleLoad();
      }
    }, 200);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      clearTimeout(timer);

      // Clean up event listeners if they exist
      if (iframe.cleanupListeners) {
        iframe.cleanupListeners();
      }
    };
  }, [htmlContent, onContentChange, editable, handleContentChange]);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      setTimeout(applyScaling, 0);
    };

    window.addEventListener("resize", handleResize);

    // Handle messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "triggerScalingCheck") {
        console.log("triggerScalingCheck");
        setTimeout(applyScaling, 100); // Small delay to allow for any DOM changes
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Create the HTML content for the iframe
  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${backgroundColor};
            overflow: hidden;
            ${editable ? "cursor: text;" : "cursor: pointer;"}
          }
          html {
            margin: 0;
            padding: 0;
          }
          .slide{
            width:max-content !important;
            height:max-content !important;
            padding:0 !important;
            margin:0 !important;
          }
          /* Make text elements more obviously editable */
          h1, h2, h3, h4, h5, h6, p, div, span {
            ${editable ? "cursor: text;" : "cursor: pointer;"}
          }
        </style>
        ${
          !editable
            ? `
        <script>
          document.addEventListener('click', function(e) {
            // Check if the clicked element is interactive
            const target = e.target;
            const isInteractive = target.tagName === 'BUTTON' || 
                                 target.tagName === 'A' || 
                                 target.tagName === 'INPUT' || 
                                 target.tagName === 'SELECT' || 
                                 target.closest('button') || 
                                 target.closest('a') || 
                                 target.closest('input') || 
                                 target.closest('select') ||
                                 target.onclick ||
                                 target.getAttribute('onclick') ||
                                 target.getAttribute('role') === 'button';
            console.log(isInteractive,"isInteractive");
            // If it's an interactive element, trigger scaling check
            if (isInteractive) {
              // Send message to parent to trigger scaling check
              console.log("triggerScalingCheck send");
              window.parent.postMessage({ type: 'triggerScalingCheck' }, '*');
            } else {
              // Only advance slide if clicking on non-interactive elements
              e.preventDefault();
              e.stopPropagation();
              // Send message to parent window
              window.parent.postMessage({ type: 'slideClick' }, '*');
            }
          });

          // Add keyboard event listeners for navigation
          document.addEventListener('keydown', function(e) {
            // Navigation keys
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              window.parent.postMessage({ type: 'nextSlide' }, '*');
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              window.parent.postMessage({ type: 'prevSlide' }, '*');
            } else if (e.key === 'Escape') {
              e.preventDefault();
              window.parent.postMessage({ type: 'exitFullscreen' }, '*');
            } else if (e.key === 'f' || e.key === 'F') {
              e.preventDefault();
              window.parent.postMessage({ type: 'toggleFullscreen' }, '*');
            }
          });
        </script>
        `
            : ""
        }
      </head>
      <body contentEditable="${editable}">
        ${htmlContent}
      </body>
    </html>
  `;

  return (
    <div
      ref={parentRef}
      className="w-full h-auto aspect-video p-4 flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: backgroundColor,
      }}
      onClick={!editable ? (e) => e.stopPropagation() : undefined}
    >
      <iframe
        ref={iframeRef}
        srcDoc={iframeContent}
        className="w-full h-full border-0"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: isVisible ? "opacity 0.3s ease-in-out" : "none",
          backgroundColor: backgroundColor,
        }}
      />
    </div>
  );
}
