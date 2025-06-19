// src/app/_components/components/VideoEditor/utils/fontLoader.ts

import { continueRender, delayRender } from "remotion";
import { GOOGLE_FONTS_URL } from "../constants/fonts";

// Function to load all fonts from a single URL
export const loadAllFonts = async (): Promise<void> => {
  const handle = delayRender("Loading fonts...");

  try {
    // Create a link tag to load font CSS from Google Fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;

    // Handle the event when the font is finished loading
    const fontLoadPromise = new Promise<void>((resolve, reject) => {
      link.onload = () => {
        console.log("Font loaded successfully!");
        // Wait a bit more to ensure the font is applied
        setTimeout(() => resolve(), 300);
      };

      link.onerror = () => {
        console.error("Failed to load font from Google Fonts");
        reject(new Error("Failed to load font from Google Fonts"));
      };
    });

    // Add the link to the head
    document.head.appendChild(link);

    // Wait for the font to finish loading
    await fontLoadPromise;
  } catch (error) {
    console.error("Error loading font:", error);
  } finally {
    continueRender(handle);
  }
};

// Function to check if a font is available
export const isFontAvailable = (fontFamily: string): boolean => {
  // Remove quotes from the font name
  const cleanFontFamily = fontFamily.replace(/['"]+/g, "");

  // Check if the font has been loaded
  const testString = "abcdefghijklmnopqrstuvwxyz";
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return false;

  const baseWidth = context.measureText(testString).width;
  context.font = `16px ${cleanFontFamily}, Arial`;
  const testWidth = context.measureText(testString).width;

  // If the width is different, the font has been loaded
  return baseWidth !== testWidth;
};
