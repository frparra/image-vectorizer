import { GoogleGenAI, Modality } from "@google/genai";

// Helper to convert File to base64 string (without the data URL prefix)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      if (base64Data) {
        resolve(base64Data);
      } else {
        reject(new Error("Failed to convert file to base64. The file might be empty or corrupt."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const editImageWithPrompt = async (
  imageFile: File,
  prompt: string
): Promise<string> => {
  // This check is for development; in a real environment, the key is assumed to be set.
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please ensure it's configured.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToBase64(imageFile);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: imageFile.type,
            },
          },
          {
            text: `Apply the following edit to the image: ${prompt}`,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // Extract the image data from the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    // This error is thrown if the API responds but doesn't include an image.
    // This might happen if the prompt is rejected for safety reasons.
    throw new Error("No image data found in the API response. The prompt may have been blocked or the model could not generate an image.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Re-throw a more user-friendly error
    throw new Error("Failed to generate image. Please check your prompt or try a different image.");
  }
};
