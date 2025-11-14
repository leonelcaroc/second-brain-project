"use client";

import { useCallback, useState } from "react";
import { UploadState, Episode } from "../types/search";

interface FileUploadProps {
  onUploadComplete: (episodes: Episode[]) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: "",
    success: "",
  });
  const [isDragOver, setIsDragOver] = useState(false);

  const processFileContent = (content: string, fileName: string): Episode[] => {
    const title = fileName.replace(/\.(txt|md)$/i, "").trim();

    const transcript = content.trim();

    return [
      {
        title: title || "Untitled Episode",
        transcript: transcript,
      },
    ];
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.includes("text/") && !file.name.endsWith(".txt")) {
        setUploadState((prev) => ({
          ...prev,
          error: "Please upload a text file (.txt)",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setUploadState((prev) => ({
          ...prev,
          error: "File size must be less than 5MB",
        }));
        return;
      }

      setUploadState({
        isUploading: true,
        progress: 0,
        error: "",
        success: "",
      });

      try {
        const content = await file.text();
        const episodes = processFileContent(content, file.name);

        setUploadState((prev) => ({ ...prev, progress: 100 }));

        setTimeout(() => {
          onUploadComplete(episodes);
          setUploadState({
            isUploading: false,
            progress: 0,
            error: "",
            success: `Successfully processed "${file.name}"`,
          });
        }, 1000);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          error: "Failed to read file",
        }));
      }
    },
    [onUploadComplete]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);

      const file = event.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
    },
    []
  );

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          isDragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        } ${uploadState.isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".txt,text/plain"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploadState.isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {uploadState.isUploading ? "Processing..." : "Upload Transcript"}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Drag and drop a TXT file, or click to browse
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Supports .txt files up to 5MB
            </p>
          </div>
        </div>

        {uploadState.isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Processing file... {uploadState.progress}%
            </p>
          </div>
        )}
      </div>

      {uploadState.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {uploadState.error}
        </div>
      )}

      {uploadState.success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
          {uploadState.success}
        </div>
      )}
    </div>
  );
}
