"use client";

import { useState, useEffect } from "react";
import getHighLevelPlan, { Slide } from "./ai/getHighLevelPlan";
import getSlideHTML from "./ai/getSlideHTML";
import editSlideHTML from "./ai/editSlideHTML";
import generateCustomSlide from "./ai/generateCustomSlide";
import SlidePreview from "./components/SlidePreview";
import { navigateTo, getShareUrl } from "./utils/urlUtils";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [slideHTMLs, setSlideHTMLs] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [generatingHTML, setGeneratingHTML] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState("");
  const [editInputs, setEditInputs] = useState<{ [key: number]: string }>({});
  const [editingSlides, setEditingSlides] = useState<{
    [key: number]: boolean;
  }>({});
  const [generatedSlides, setGeneratedSlides] = useState<{
    [key: number]: boolean;
  }>({});

  // New state for tracking original HTML before edits
  const [originalHTMLs, setOriginalHTMLs] = useState<{ [key: number]: string }>(
    {}
  );

  // New state for side-by-side edit comparison
  const [editPreviewMode, setEditPreviewMode] = useState<{
    [key: number]: boolean;
  }>({});
  const [tempEditHTMLs, setTempEditHTMLs] = useState<{ [key: number]: string }>(
    {}
  );

  // New state for slide insertion
  const [showInsertInput, setShowInsertInput] = useState<number | null>(null);
  const [insertInput, setInsertInput] = useState("");
  const [insertingSlide, setInsertingSlide] = useState(false);
  const [insertingSlideIndex, setInsertingSlideIndex] = useState<number | null>(
    null
  );

  // New state for slide deletion
  const [deletingSlide, setDeletingSlide] = useState<number | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const slidesData = localStorage.getItem("slidesData");
    const htmlsData = localStorage.getItem("slideHTMLsData");
    const savedPrompt = localStorage.getItem("savedPrompt");
    const savedApiKey = localStorage.getItem("savedApiKey");

    if (slidesData && htmlsData) {
      try {
        const parsedSlides = JSON.parse(slidesData);
        const parsedHTMLs = JSON.parse(htmlsData);

        setSlides(parsedSlides);
        setSlideHTMLs(parsedHTMLs);

        // Mark all slides as generated since they're loaded from storage
        const generatedState: { [key: number]: boolean } = {};
        parsedSlides.forEach((slide: Slide) => {
          generatedState[slide.number] = true;
        });
        setGeneratedSlides(generatedState);
      } catch (error) {
        console.error("Error parsing slides data:", error);
      }
    }

    // Restore saved prompt and API key if available
    if (savedPrompt) {
      setPrompt(savedPrompt);
    }
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save data to localStorage whenever slides or HTMLs change
  useEffect(() => {
    if (slides.length > 0) {
      localStorage.setItem("slidesData", JSON.stringify(slides));
      localStorage.setItem("slideHTMLsData", JSON.stringify(slideHTMLs));
      localStorage.setItem("savedPrompt", prompt);
      localStorage.setItem("savedApiKey", apiKey);
    }
  }, [slides, slideHTMLs, prompt, apiKey]);

  const handleNewSlideshow = () => {
    // Clear localStorage
    localStorage.removeItem("slidesData");
    localStorage.removeItem("slideHTMLsData");
    localStorage.removeItem("savedPrompt");

    // Reset all state
    setSlides([]);
    setSlideHTMLs({});
    setCurrentSlideIndex(0);
    setError("");
    setEditInputs({});
    setEditingSlides({});
    setGeneratedSlides({});
    setShowInsertInput(null);
    setInsertInput("");
    setInsertingSlide(false);
    setInsertingSlideIndex(null);
    setOriginalHTMLs({});
    setEditPreviewMode({});
    setTempEditHTMLs({});

    // Reset form to default values
    setPrompt("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !apiKey.trim()) return;

    setLoading(true);
    setError("");
    setSlides([]);
    setSlideHTMLs({});
    setCurrentSlideIndex(0);
    setGeneratedSlides({});

    try {
      const result = await getHighLevelPlan(prompt, apiKey);
      setSlides(result);

      // Start generating HTML for all slides
      generateAllSlideHTML(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateAllSlideHTML = async (slideArray: Slide[]) => {
    setGeneratingHTML(true);
    setError("");

    for (let i = 0; i < slideArray.length; i++) {
      const slide = slideArray[i];
      setCurrentSlideIndex(i);

      try {
        const html = await getSlideHTML(slide, slideArray, apiKey);
        setSlideHTMLs((prev) => ({ ...prev, [slide.number]: html }));

        // Mark slide as generated and trigger fade-in effect
        setTimeout(() => {
          setGeneratedSlides((prev) => ({ ...prev, [slide.number]: true }));
        }, 100);

        // Wait 2 seconds between requests to avoid rate limiting
        if (i < slideArray.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (err) {
        console.warn(`Failed to generate HTML for slide ${slide.number}:`, err);
        // Continue with next slide even if one fails
      }
    }

    setGeneratingHTML(false);
    setCurrentSlideIndex(0);
  };

  const handleEditSlide = async (slideNumber: number) => {
    const editMessage = editInputs[slideNumber];
    if (!editMessage?.trim()) return;

    const slide = slides.find((s) => s.number === slideNumber);
    if (!slide || !slideHTMLs[slideNumber]) return;

    setEditingSlides((prev) => ({ ...prev, [slideNumber]: true }));
    setError("");

    try {
      // Save the original HTML before editing
      setOriginalHTMLs((prev) => ({
        ...prev,
        [slideNumber]: slideHTMLs[slideNumber],
      }));

      const newHTML = await editSlideHTML(
        slide,
        slides,
        slideHTMLs[slideNumber],
        editMessage,
        apiKey
      );

      // Store the new HTML temporarily instead of applying it immediately
      setTempEditHTMLs((prev) => ({ ...prev, [slideNumber]: newHTML }));
      // Don't clear the edit input - keep it for potential modifications

      // Show preview mode for side-by-side comparison
      setEditPreviewMode((prev) => ({ ...prev, [slideNumber]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit slide");
    } finally {
      setEditingSlides((prev) => ({ ...prev, [slideNumber]: false }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, slideNumber: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditSlide(slideNumber);
    }
  };

  const handleAcceptEdit = (slideNumber: number) => {
    // Apply the temporary edit to the main slide HTMLs
    if (tempEditHTMLs[slideNumber]) {
      setSlideHTMLs((prev) => ({
        ...prev,
        [slideNumber]: tempEditHTMLs[slideNumber],
      }));
    }

    // Clear the edit input when accepting
    setEditInputs((prev) => ({ ...prev, [slideNumber]: "" }));

    // Exit preview mode and clean up
    setEditPreviewMode((prev) => ({ ...prev, [slideNumber]: false }));
    setTempEditHTMLs((prev) => {
      const newState = { ...prev };
      delete newState[slideNumber];
      return newState;
    });
    setOriginalHTMLs((prev) => {
      const newState = { ...prev };
      delete newState[slideNumber];
      return newState;
    });
  };

  const handleRejectEdit = (slideNumber: number) => {
    // Exit preview mode and clean up without applying changes
    // Keep the edit input so user can modify it and try again
    setEditPreviewMode((prev) => ({ ...prev, [slideNumber]: false }));
    setTempEditHTMLs((prev) => {
      const newState = { ...prev };
      delete newState[slideNumber];
      return newState;
    });
    setOriginalHTMLs((prev) => {
      const newState = { ...prev };
      delete newState[slideNumber];
      return newState;
    });
  };

  const handleContentChange = (slideNumber: number, newHtmlContent: string) => {
    setSlideHTMLs((prev) => ({ ...prev, [slideNumber]: newHtmlContent }));
  };

  const generateNewSlide = async (
    description: string,
    insertAfterIndex: number
  ) => {
    if (!description.trim() || !apiKey.trim()) return;

    setInsertingSlide(true);
    setInsertingSlideIndex(insertAfterIndex);
    setError("");

    try {
      // Use the new function to generate both slide data and HTML
      const result = await generateCustomSlide(
        description,
        insertAfterIndex,
        slides,
        apiKey
      );

      // Insert the new slide at the specified position
      const newSlides = [...slides];
      newSlides.splice(insertAfterIndex + 1, 0, result.slide);

      // Update slide numbers to maintain order
      const updatedSlides = newSlides.map((slide, index) => ({
        ...slide,
        number: index + 1,
      }));

      // Update slide HTMLs with new numbering
      const updatedSlideHTMLs: { [key: number]: string } = {};

      // Copy existing HTMLs with updated numbering
      Object.keys(slideHTMLs).forEach((key) => {
        const oldNumber = parseInt(key);
        let newNumber: number;

        if (oldNumber <= insertAfterIndex + 1) {
          // Slides before insertion point keep same number
          newNumber = oldNumber;
        } else {
          // Slides after insertion point get incremented
          newNumber = oldNumber + 1;
        }

        updatedSlideHTMLs[newNumber] = slideHTMLs[oldNumber];
      });

      // Add the new slide's HTML at the correct position
      updatedSlideHTMLs[insertAfterIndex + 2] = result.html;

      // Update edit inputs with new numbering
      const updatedEditInputs: { [key: number]: string } = {};
      Object.keys(editInputs).forEach((key) => {
        const oldNumber = parseInt(key);
        let newNumber: number;

        if (oldNumber <= insertAfterIndex + 1) {
          newNumber = oldNumber;
        } else {
          newNumber = oldNumber + 1;
        }

        updatedEditInputs[newNumber] = editInputs[oldNumber];
      });

      // Update editing slides state with new numbering
      const updatedEditingSlides: { [key: number]: boolean } = {};
      Object.keys(editingSlides).forEach((key) => {
        const oldNumber = parseInt(key);
        let newNumber: number;

        if (oldNumber <= insertAfterIndex + 1) {
          newNumber = oldNumber;
        } else {
          newNumber = oldNumber + 1;
        }

        updatedEditingSlides[newNumber] = editingSlides[oldNumber];
      });

      // Update generated slides state with new numbering
      const updatedGeneratedSlides: { [key: number]: boolean } = {};
      Object.keys(generatedSlides).forEach((key) => {
        const oldNumber = parseInt(key);
        let newNumber: number;

        if (oldNumber <= insertAfterIndex + 1) {
          newNumber = oldNumber;
        } else {
          newNumber = oldNumber + 1;
        }

        updatedGeneratedSlides[newNumber] = generatedSlides[oldNumber];
      });

      setSlides(updatedSlides);
      setSlideHTMLs(updatedSlideHTMLs);
      setEditInputs(updatedEditInputs);
      setEditingSlides(updatedEditingSlides);
      setGeneratedSlides(updatedGeneratedSlides);

      // Mark the new slide as generated
      setTimeout(() => {
        setGeneratedSlides((prev) => ({
          ...prev,
          [insertAfterIndex + 2]: true,
        }));
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate new slide"
      );
    } finally {
      setInsertingSlide(false);
      setInsertingSlideIndex(null);
      setShowInsertInput(null);
      setInsertInput("");
    }
  };

  const handleInsertSlide = (index: number) => {
    setShowInsertInput(index);
    setInsertInput("");
  };

  const handleInsertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showInsertInput !== null && insertInput.trim()) {
      generateNewSlide(insertInput, showInsertInput);
    }
  };

  const handleInsertCancel = () => {
    setShowInsertInput(null);
    setInsertInput("");
  };

  const handleDeleteSlide = async (slideNumber: number) => {
    setDeletingSlide(slideNumber);
    setError("");

    try {
      // Remove the slide from the slides array
      const updatedSlides = slides.filter(
        (slide) => slide.number !== slideNumber
      );

      // Renumber the remaining slides
      const renumberedSlides = updatedSlides.map((slide, index) => ({
        ...slide,
        number: index + 1,
      }));

      // Update slide HTMLs with new numbering
      const updatedSlideHTMLs: { [key: number]: string } = {};
      const updatedEditInputs: { [key: number]: string } = {};
      const updatedEditingSlides: { [key: number]: boolean } = {};
      const updatedGeneratedSlides: { [key: number]: boolean } = {};

      // Use the original slide numbers to map data correctly
      updatedSlides.forEach((slide, index) => {
        const newNumber = index + 1;
        const originalNumber = slide.number; // Use the original number before renumbering

        if (slideHTMLs[originalNumber]) {
          updatedSlideHTMLs[newNumber] = slideHTMLs[originalNumber];
        }
        if (editInputs[originalNumber]) {
          updatedEditInputs[newNumber] = editInputs[originalNumber];
        }
        if (editingSlides[originalNumber] !== undefined) {
          updatedEditingSlides[newNumber] = editingSlides[originalNumber];
        }
        if (generatedSlides[originalNumber] !== undefined) {
          updatedGeneratedSlides[newNumber] = generatedSlides[originalNumber];
        }
      });

      setSlides(renumberedSlides);
      setSlideHTMLs(updatedSlideHTMLs);
      setEditInputs(updatedEditInputs);
      setEditingSlides(updatedEditingSlides);
      setGeneratedSlides(updatedGeneratedSlides);

      // Reset current slide index if needed
      if (currentSlideIndex >= slideNumber - 1) {
        setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete slide");
    } finally {
      setDeletingSlide(null);
    }
  };

  const handleViewSlides = () => {
    navigateTo("/slides");
  };

  const handleShare = async () => {
    const data = {
      slides: slides,
      slideHTMLs: slideHTMLs,
      generatedAt: new Date().toISOString(),
      prompt: prompt,
    };

    // Generate a random code for the share
    const shareCode = crypto.randomUUID().replace(/-/g, "").substring(0, 16);

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyn0nN6K5ZrsEpSwZz32JW8a2CnSN0zy1cyaaWP7Q-C1rulF_N8CzG7eCT1wFEzjbZIlQ/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          redirect: "follow",
          body: JSON.stringify({
            key: shareCode,
            value: JSON.stringify(data),
          }),
        }
      );

      if (response.ok) {
        const shareUrl = getShareUrl(shareCode);
        const userInput = window.prompt(
          `Heres the link to your slideshow`,
          shareUrl
        );

        if (userInput) {
          // Copy to clipboard if supported
          if (navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(shareUrl);
              alert("URL copied to clipboard!");
            } catch (err) {
              console.error("Failed to copy to clipboard:", err);
            }
          }
        }
      } else {
        alert("Failed to share. Please try again.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      alert("Failed to share. Please try again.");
    }
  };

  const showInputForm = slides.length === 0 && !loading && !generatingHTML;
  const allSlidesGenerated =
    slides.length > 0 &&
    slides.every((slide) => slideHTMLs[slide.number]) &&
    !generatingHTML &&
    !insertingSlide;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {showInputForm && (
          <>
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
              Slides
            </h1>

            <form onSubmit={handleSubmit} className="mb-8">
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="apiKey"
                    className="block text-sm font-medium mb-2"
                  >
                    Gemini API Key
                  </label>
                  <input
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="prompt"
                    className="block text-sm font-medium mb-2"
                  >
                    Presentation Prompt
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your presentation topic, audience, and goals..."
                    className="w-full p-4 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim() || !apiKey.trim()}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Generating Plan..." : "Generate Slide Plan"}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Generating slide plan...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {slides.length > 0 && (
          <button
            type="button"
            onClick={handleNewSlideshow}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            New Slideshow
          </button>
        )}
        <br />
        <br />
        {slides.length > 0 && (
          <div className="space-y-4">
            {slides.map((slide, index) => (
              <div key={slide.number}>
                {/* Insert slide button - appears on hover between slides */}
                {index > 0 &&
                  slideHTMLs[slides[index - 1].number] &&
                  slideHTMLs[slide.number] &&
                  !generatingHTML &&
                  !insertingSlide && (
                    <div className="relative group">
                      <div className="h-8 flex items-center justify-center">
                        <button
                          onClick={() => handleInsertSlide(index - 1)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-700 text-sm font-bold"
                          title="Add slide here"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                {/* Insert input form */}
                {showInsertInput === index - 1 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <form onSubmit={handleInsertSubmit} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Describe the new slide:
                        </label>
                        <textarea
                          value={insertInput}
                          onChange={(e) => setInsertInput(e.target.value)}
                          placeholder="Describe what you want in this new slide..."
                          className="w-full p-3 border border-blue-300 rounded-lg resize-none h-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={!insertInput.trim() || insertingSlide}
                          className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {insertingSlide ? "Generating..." : "Generate Slide"}
                        </button>
                        <button
                          type="button"
                          onClick={handleInsertCancel}
                          disabled={insertingSlide}
                          className="bg-gray-500 text-white px-4 py-2 rounded font-medium hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Loading indicator for new slide insertion */}
                {insertingSlide && insertingSlideIndex === index - 1 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-blue-700 font-medium">
                        Generating new slide...
                      </span>
                    </div>
                    <div className="mt-2 text-center">
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full animate-pulse"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing slide content */}
                <div
                  className={`bg-white border border-gray-200 rounded-lg transition-all duration-500 relative group ${
                    generatingHTML && index === currentSlideIndex
                      ? "ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  {/* Delete button - appears on hover */}
                  <button
                    onClick={() => handleDeleteSlide(slide.number)}
                    disabled={deletingSlide === slide.number}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-bold z-10"
                    title="Delete slide"
                  >
                    {deletingSlide === slide.number ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      "×"
                    )}
                  </button>

                  <div
                    className={`p-4 transition-opacity duration-300 ${
                      editingSlides[slide.number] ? "opacity-50" : "opacity-100"
                    }`}
                  >
                    {editPreviewMode[slide.number] ? (
                      // Side-by-side comparison view
                      <div className="space-y-4">
                        <div className="text-center mb-4">
                          <h4 className="text-lg font-semibold text-gray-800">
                            Edit Preview
                          </h4>
                          <p className="text-sm text-gray-600">
                            Compare the original with your edit
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Original version */}
                          <div className="border-2 border-gray-200 rounded-lg p-2">
                            <div className="text-center mb-2">
                              <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                Original
                              </span>
                            </div>
                            <SlidePreview
                              htmlContent={originalHTMLs[slide.number]}
                              slideNumber={slide.number}
                              onContentChange={() => {}} // Read-only in preview
                              editable={false}
                            />
                          </div>

                          {/* Edited version */}
                          <div className="border-2 border-blue-200 rounded-lg p-2">
                            <div className="text-center mb-2">
                              <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                Edited
                              </span>
                            </div>
                            <SlidePreview
                              htmlContent={tempEditHTMLs[slide.number]}
                              slideNumber={slide.number}
                              onContentChange={() => {}} // Read-only in preview
                              editable={false}
                            />
                          </div>
                        </div>

                        {/* Accept/Reject buttons */}
                        <div className="flex justify-center gap-4 pt-4">
                          <button
                            onClick={() => handleAcceptEdit(slide.number)}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Accept Edit
                          </button>
                          <button
                            onClick={() => handleRejectEdit(slide.number)}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal view
                      <div
                        className={`${
                          editingSlides[slide.number] ? "animate-pulse" : ""
                        }`}
                      >
                        <SlidePreview
                          htmlContent={slideHTMLs[slide.number]}
                          slideNumber={slide.number}
                          onContentChange={handleContentChange}
                          editable={slide.type !== "Interactive"}
                        />
                      </div>
                    )}
                  </div>

                  {/* Minimal Edit Section */}
                  <div className="px-4 pb-4">
                    {!editPreviewMode[slide.number] && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editInputs[slide.number] || ""}
                          onChange={(e) =>
                            setEditInputs((prev) => ({
                              ...prev,
                              [slide.number]: e.target.value,
                            }))
                          }
                          onKeyPress={(e) => handleKeyPress(e, slide.number)}
                          placeholder="Edit this slide..."
                          className="flex-1 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm"
                          disabled={editingSlides[slide.number]}
                        />
                        <button
                          onClick={() => handleEditSlide(slide.number)}
                          disabled={
                            !editInputs[slide.number]?.trim() ||
                            editingSlides[slide.number]
                          }
                          className="bg-blue-600 text-white px-3 py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {editingSlides[slide.number] ? "..." : "Edit"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {generatingHTML && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            Generating slide {currentSlideIndex + 1} of {slides.length}...
          </div>
        )}

        {allSlidesGenerated && (
          <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Presentation Ready!
            </h3>
            <div className="flex gap-4">
              <button
                onClick={handleViewSlides}
                style={{ backgroundColor: "#008000" }}
                className="text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                View Slides
              </button>
              <button
                onClick={handleShare}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
