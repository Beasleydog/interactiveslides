"use client";

import { useEffect, useState } from "react";

export default function Load() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedData = async () => {
      // Get id from URL manually
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");

      if (!id) {
        setError("No share ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbyn0nN6K5ZrsEpSwZz32JW8a2CnSN0zy1cyaaWP7Q-C1rulF_N8CzG7eCT1wFEzjbZIlQ/exec?key=${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch shared data");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.value) {
          try {
            const parsedData = JSON.parse(data.value);

            // Store the data in localStorage
            localStorage.setItem(
              "slidesData",
              JSON.stringify(parsedData.slides)
            );
            localStorage.setItem(
              "slideHTMLsData",
              JSON.stringify(parsedData.slideHTMLs)
            );
            if (parsedData.prompt) {
              localStorage.setItem("savedPrompt", parsedData.prompt);
            }

            // Redirect to slides page
            window.location.href = "/slides";
          } catch {
            throw new Error("Invalid shared data format");
          }
        } else {
          throw new Error("No data found for this share ID");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load shared data"
        );
        setLoading(false);
      }
    };

    loadSharedData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">
            Loading shared presentation...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-xl mb-4">
            Error Loading Presentation
          </div>
          <div className="text-gray-700 mb-6">{error}</div>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Editor
          </button>
        </div>
      </div>
    );
  }

  return null;
}
