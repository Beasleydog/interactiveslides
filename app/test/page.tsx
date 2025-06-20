"use client";

import { useState } from "react";
import EditableSlidePreview from "../components/EditableSlidePreview";

export default function TestPage() {
  const [htmlContent, setHtmlContent] = useState(`<!DOCTYPE html>
<html>
<head>
  <title>Slide Preview</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .slide-content {
      text-align: center;
      max-width: 800px;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    p {
      font-size: 1.5rem;
      line-height: 1.6;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="slide-content">
    <h1>Welcome to Your Slide</h1>
    <p>Edit the HTML in the textarea to see your changes here in real-time!</p>
  </div>
</body>
</html>`);

  return (
    <div className="flex h-screen bg-gray-100 text-black">
      {/* Left side - HTML Editor */}
      <div className="w-1/2 p-4 border-r border-gray-300">
        <div className="mb-4">
          <h2 className="text-xl font-bold  mb-2">HTML Editor</h2>
          <p className="text-sm ">
            Write your HTML here and see it rendered on the right
          </p>
        </div>
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          className="w-full h-[calc(100vh-120px)] p-4 border border-gray-300 rounded-lg font-mono text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          placeholder="Enter your HTML here..."
        />
      </div>

      {/* Right side - Slide Preview */}
      <div className="w-1/2 p-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Slide Preview
          </h2>
          <p className="text-sm text-gray-600">
            Live preview of your HTML content
          </p>
        </div>
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white h-[calc(100vh-120px)]">
          <EditableSlidePreview htmlContent={htmlContent} />
        </div>
      </div>
    </div>
  );
}
