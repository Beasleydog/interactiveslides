// Utility functions for handling URLs in different environments
// GitHub Pages: https://beasleydog.github.io/aislides
// Local: https://localhost:3000

export const getBaseUrl = (): string => {
  // Check if we're on GitHub Pages by looking at the hostname
  const isGitHubPages = window.location.hostname === "beasleydog.github.io";

  if (isGitHubPages) {
    return "https://beasleydog.github.io/aislides";
  } else {
    // Local development
    return window.location.origin;
  }
};

export const getRelativeUrl = (path: string): string => {
  const baseUrl = getBaseUrl();

  if (baseUrl.includes("github.io")) {
    // GitHub Pages - path should start with /aislides
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  } else {
    // Local development - use relative path
    return path.startsWith("/") ? path : `/${path}`;
  }
};

export const navigateTo = (path: string): void => {
  const url = getRelativeUrl(path);
  window.location.href = url;
};

export const getShareUrl = (shareCode: string): string => {
  const baseUrl = getBaseUrl();

  if (baseUrl.includes("github.io")) {
    // GitHub Pages
    return `${baseUrl}/load?id=${shareCode}`;
  } else {
    // Local development
    return `${baseUrl}/load?id=${shareCode}`;
  }
};

// Helper function to check if we're in development mode
export const isDevelopment = (): boolean => {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
};

// Helper function to check if we're on GitHub Pages
export const isGitHubPages = (): boolean => {
  return window.location.hostname === "beasleydog.github.io";
};
