"use client";

import { useState, useEffect, useRef } from "react";
import SlidePreview from "../components/SlidePreview";
import { Slide } from "../ai/getHighLevelPlan";
import { navigateTo } from "../utils/urlUtils";

export default function SlidesDisplay() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [slideHTMLs, setSlideHTMLs] = useState<{ [key: number]: string }>({});
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get data from localStorage
    const slidesData = localStorage.getItem("slidesData");
    const htmlsData = localStorage.getItem("slideHTMLsData");

    if (slidesData && htmlsData) {
      try {
        const parsedSlides = JSON.parse(slidesData);
        const parsedHTMLs = JSON.parse(htmlsData);

        setSlides(parsedSlides);
        setSlideHTMLs(parsedHTMLs);
      } catch (error) {
        console.error("Error parsing slides data:", error);
      }
    }
    setLoading(false);
  }, []);

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const enterFullscreen = async () => {
    if (fullscreenRef.current) {
      try {
        await fullscreenRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error("Error entering fullscreen:", error);
      }
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error("Error exiting fullscreen:", error);
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    console.log("Key pressed:", e.key, "Fullscreen:", isFullscreen); // Debug log

    if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      console.log("Next slide"); // Debug log
      nextSlide();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      console.log("Previous slide"); // Debug log
      prevSlide();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (isFullscreen) {
        exitFullscreen();
      } else {
        window.history.back();
      }
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      if (isFullscreen) {
        exitFullscreen();
      } else {
        enterFullscreen();
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);

    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "slideClick" && isFullscreen) {
        nextSlide();
      } else if (event.data.type === "nextSlide") {
        nextSlide();
      } else if (event.data.type === "prevSlide") {
        prevSlide();
      } else if (event.data.type === "exitFullscreen") {
        exitFullscreen();
      } else if (event.data.type === "toggleFullscreen") {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("message", handleMessage);
    };
  }, [currentSlideIndex, isFullscreen]);

  const handleNewSlideshow = () => {
    // Clear localStorage
    localStorage.removeItem("slidesData");
    localStorage.removeItem("slideHTMLsData");
    localStorage.removeItem("savedPrompt");

    // Redirect to editor
    navigateTo("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading slides...</div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">No slides to display</div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];
  const currentHTML = slideHTMLs[currentSlide.number];

  return (
    <>
      {/* Hidden fullscreen container */}
      <div
        ref={fullscreenRef}
        className={`fixed inset-0 bg-black cursor-pointer flex items-center justify-center ${
          isFullscreen ? "block" : "hidden"
        }`}
        onClick={(e) => {
          // Only advance slide if clicking on the background container itself
          if (e.target === e.currentTarget) {
            nextSlide();
          }
        }}
      >
        <div className="w-full h-full bg-white overflow-hidden">
          {currentHTML ? (
            <SlidePreview
              htmlContent={currentHTML}
              slideNumber={currentSlide.number}
              onContentChange={() => {}} // Read-only in display mode
              editable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl font-semibold mb-4">
                  {currentSlide.title}
                </div>
                <div className="text-lg">{currentSlide.purpose}</div>
              </div>
            </div>
          )}
        </div>

        {/* Minimal slide counter */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
          {currentSlideIndex + 1} / {slides.length}
        </div>
      </div>

      {/* Normal view */}
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Simple header */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <div className="text-lg font-semibold">
            Slide {currentSlideIndex + 1} of {slides.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={enterFullscreen}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
            >
              Fullscreen (F)
            </button>
            <button
              onClick={handleNewSlideshow}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
            >
              New Slideshow
            </button>
            <button
              onClick={() => navigateTo("")}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              Back to Editor
            </button>
          </div>
        </div>

        {/* Simple slide preview */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-4xl aspect-video bg-white rounded-lg shadow-2xl overflow-hidden">
            {currentHTML ? (
              <SlidePreview
                htmlContent={currentHTML}
                slideNumber={currentSlide.number}
                onContentChange={() => {}} // Read-only in display mode
                editable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-2xl font-semibold mb-2">
                    {currentSlide.title}
                  </div>
                  <div className="text-sm">{currentSlide.purpose}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Simple navigation */}
        <div className="bg-gray-800 p-4">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            <button
              onClick={prevSlide}
              disabled={currentSlideIndex === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition-colors"
            >
              ← Previous
            </button>

            <div className="text-white text-sm">
              Use arrow keys or click Fullscreen for presentation mode
            </div>

            <button
              onClick={nextSlide}
              disabled={currentSlideIndex === slides.length - 1}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
