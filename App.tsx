import React, { useState, useRef, useCallback } from 'react';
import { editImageWithPrompt } from './services/geminiService';
import { STYLES } from './constants';
import { UploadIcon, MagicWandIcon, ImageIcon, ErrorIcon, DownloadIcon } from './components/Icons';

// Helper components defined outside the main component to prevent re-renders.

const ImagePlaceholder: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    onClick={onClick}
    className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-600 hover:border-blue-500 transition-all duration-300 cursor-pointer p-8 text-center"
  >
    <UploadIcon />
    <p className="mt-4 text-lg font-semibold text-gray-300">Click to upload an image</p>
    <p className="text-sm text-gray-500">PNG, JPG, or WEBP</p>
  </div>
);

const ImagePreview: React.FC<{ src: string; alt: string; onClick?: () => void }> = ({ src, alt, onClick }) => (
  <div className="w-full h-full relative group" onClick={onClick}>
    <img src={src} alt={alt} className="w-full h-full object-contain rounded-2xl" />
     {onClick && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl cursor-pointer">
            <p className="text-white font-semibold">Click to change image</p>
        </div>
    )}
  </div>
);

const Loader: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-600 p-8 text-center">
        <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-semibold text-gray-300">Gemini is creating magic...</p>
        <p className="text-sm text-gray-500">This may take a moment.</p>
    </div>
);

const OutputPlaceholder: React.FC = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-600 p-8 text-center">
        <ImageIcon />
        <p className="mt-4 text-lg font-semibold text-gray-300">Your styled image will appear here</p>
        <p className="text-sm text-gray-500">Select a style and click generate</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/20 text-red-300 rounded-2xl border-2 border-dashed border-red-500/50 p-8 text-center">
        <ErrorIcon />
        <p className="mt-4 text-lg font-semibold">An Error Occurred</p>
        <p className="text-sm text-gray-400 mt-2">{message}</p>
    </div>
);

export default function App() {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImageFile(file);
      setOriginalImageUrl(URL.createObjectURL(file));
      setEditedImageUrl(null);
      setError(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleStyleClick = (style: string) => {
    setPrompt(style);
  };
  
  const handleGenerate = useCallback(async () => {
    if (!originalImageFile || !prompt) {
      setError('Please upload an image and select a style or enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const base64Data = await editImageWithPrompt(originalImageFile, prompt);
      setEditedImageUrl(`data:image/png;base64,${base64Data}`);
    } catch (e) {
      const error = e as Error;
      console.error(e);
      setError(error.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImageFile, prompt]);

  const handleDownload = () => {
    if (!editedImageUrl) return;
    const link = document.createElement('a');
    link.href = editedImageUrl;
    link.download = 'gemini-styled-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Gemini Image Stylizer
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Transform your images with AI-powered styles and prompts.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Image Upload and Preview */}
          <div className="aspect-square flex items-center justify-center p-4 bg-black/20 rounded-3xl shadow-2xl">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            {originalImageUrl ? (
              <ImagePreview src={originalImageUrl} alt="Original upload" onClick={triggerFileInput}/>
            ) : (
              <ImagePlaceholder onClick={triggerFileInput} />
            )}
          </div>

          {/* Right Panel: Controls and Output */}
          <div className="flex flex-col gap-8">
            {/* Controls */}
            <div className="p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-3xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-gray-200">1. Choose a Style</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {STYLES.map((style) => (
                  <button
                    key={style}
                    onClick={() => handleStyleClick(style)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                      prompt === style
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              <h3 className="text-xl font-semibold mb-3 mt-6 text-gray-300">...or write your own prompt</h3>
               <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Make it look like a watercolor painting'"
                className="w-full p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-200 placeholder-gray-500 resize-none h-24"
              />
              <button
                onClick={handleGenerate}
                disabled={isLoading || !originalImageFile || !prompt}
                className="w-full mt-4 flex items-center justify-center py-3 px-6 text-lg font-semibold rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg disabled:shadow-none"
              >
                <MagicWandIcon />
                {isLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {/* Output */}
            <div className="aspect-square flex items-center justify-center p-4 bg-black/20 rounded-3xl shadow-2xl relative">
                {isLoading ? (
                    <Loader />
                ) : error ? (
                    <ErrorDisplay message={error} />
                ) : editedImageUrl ? (
                    <>
                        <ImagePreview src={editedImageUrl} alt="Edited image" />
                        <button
                            onClick={handleDownload}
                            className="absolute top-4 right-4 bg-gray-900/70 text-white p-3 rounded-full hover:bg-blue-600 transition-colors duration-200 backdrop-blur-sm"
                            aria-label="Download image"
                            title="Download image"
                        >
                            <DownloadIcon />
                        </button>
                    </>
                ) : (
                    <OutputPlaceholder />
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}