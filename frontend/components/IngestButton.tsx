"use client";

import { useState } from "react";
import { Episode } from "../types/search";

interface IngestButtonProps {
  episodes: Episode[];
  onIngestComplete: () => void;
}

export default function IngestButton({
  episodes,
  onIngestComplete,
}: IngestButtonProps) {
  const [isIngesting, setIsIngesting] = useState(false);
  const [message, setMessage] = useState("");

  const handleIngest = async () => {
    if (episodes.length === 0) return;

    setIsIngesting(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:5001/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ episodes }),
      });

      if (!response.ok) {
        throw new Error("Ingestion failed");
      }

      const data = await response.json();
      setMessage(data.message);
      onIngestComplete();
    } catch (error) {
      setMessage(
        "Failed to ingest transcripts. Make sure the backend server is running."
      );
      console.error("Ingestion error:", error);
    } finally {
      setIsIngesting(false);
    }
  };

  if (episodes.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleIngest}
        disabled={isIngesting}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {isIngesting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Ingesting {episodes.length} episode
            {episodes.length !== 1 ? "s" : ""}...
          </div>
        ) : (
          `Ingest ${episodes.length} Episode${episodes.length !== 1 ? "s" : ""}`
        )}
      </button>

      {message && (
        <div
          className={`mt-3 p-3 rounded-xl text-sm ${
            message.includes("Failed")
              ? "bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              : "bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
