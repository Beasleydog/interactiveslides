"use client";

import { useState, useEffect, useRef } from "react";
import htmlToKeyTextObjects from "@/app/helpers/htmlToKeyTextObjects";
import decodeToHTML from "@/app/helpers/decodeToHTML";

interface SlidePreviewProps {
  htmlContent: string;
  slideNumber: number;
}

export default function SlidePreview({
  htmlContent,
  slideNumber,
}: SlidePreviewProps) {
  const [scale, setScale] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
  const [processedHtmlContent, setProcessedHtmlContent] = useState<string>("");
  const parentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [slideHeight, setSlideHeight] = useState(0);
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
      // Find the first child element that has content
      const body = iframe.contentDocument.body;
      let firstChild = body.children[0] as HTMLElement;

      // If no first child or first child is empty, look for any element with content
      if (!firstChild || firstChild.children.length === 0) {
        const allElements = body.querySelectorAll("*");
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i] as HTMLElement;
          if (element.children.length > 0 || element.textContent?.trim()) {
            firstChild = element;
            break;
          }
        }
      }

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

      firstChild.style.transform = `${scaleStyle} translate(${translateX}px, ${translateY}px)`;

      setIsVisible(true);
    } catch (error) {
      console.warn("Error applying scaling:", error);
    }
  };

  // Process HTML content through the key text objects pipeline
  useEffect(() => {
    const processHtmlContent = async () => {
      // Convert HTML to key text objects
      const keyTextObjectInfo = await htmlToKeyTextObjects(htmlContent);
      const keyTextObjects = keyTextObjectInfo.objects;
      setSlideWidth(keyTextObjectInfo.slideWidth);
      setSlideHeight(keyTextObjectInfo.slideHeight);

      // Convert key text objects back to HTML
      const decodedHtml = decodeToHTML(keyTextObjects);
      setProcessedHtmlContent(decodedHtml);

      // Extract background color from the processed HTML

      //TOOD: USE THE ORIGINAL HTML HERE?
      const extractedColor = extractBackgroundColor(decodedHtml);
      setBackgroundColor(extractedColor);
    };

    processHtmlContent();
  }, [htmlContent]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Wait for iframe to load before applying scaling
    const handleLoad = () => {
      setTimeout(() => {
        applyScaling();
      }, 100); // Small delay to ensure content is rendered
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
    };
  }, [processedHtmlContent]);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      setTimeout(applyScaling, 100);
    };

    window.addEventListener("resize", handleResize);

    // Handle messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "triggerScalingCheck") {
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
          }
          html {
            margin: 0;
            padding: 0;
          }
          .slide{
            width:max-content !important;
            height:max-content !important;
          }
        </style>
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
            
            // If it's an interactive element, trigger scaling check
            if (isInteractive) {
              // Send message to parent to trigger scaling check
              window.parent.postMessage({ type: 'triggerScalingCheck' }, '*');
            }
          });
        </script>
      </head>
      <body>
      <div style="width:${slideWidth}px;height:${slideHeight}px;">
        ${processedHtmlContent}
        </div>
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
    >
      <iframe
        ref={iframeRef}
        srcDoc={iframeContent}
        className="w-full h-full border-0"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          backgroundColor: backgroundColor,
        }}
      />
    </div>
  );
}
