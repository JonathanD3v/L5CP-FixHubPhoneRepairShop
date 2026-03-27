// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "/placeholder-image.jpg";
  if (imagePath.startsWith("http")) return imagePath;
  // Use environment variable for server URL
  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5555";
  return `${serverUrl}${imagePath}`;
};

// Other formatting utilities can be added here
