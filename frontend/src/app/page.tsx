"use client";

import { useState } from "react";
import FileUpload from "../../components/FileUpload";
import IngestButton from "../../components/IngestButton";
import { SearchResult, SearchResponse, Episode } from "../../types/search";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5001/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (err) {
      setError("Failed to search. Make sure the backend server is running.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (newEpisodes: Episode[]) => {
    setEpisodes((prev) => [...prev, ...newEpisodes]);
  };

  const handleIngestComplete = () => {
    setEpisodes([]);
    setShowUpload(false);
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + "%";
  };

  const getScoreColor = (score: number) => {
    if (score > 0.8)
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (score > 0.6)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 mask-[linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              AI-Powered Knowledge Base
            </div>

            <h1 className="text-5xl md:text-7xl font-bold bg-linear-to-br from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-6">
              Second Brain Project
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
              Instantly search your transcripts and conversations with semantic
              AI search. Your knowledge, always accessible.
            </p>
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-4 -mt-8">
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Add Content
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload transcript files to build your knowledge base
                </p>
              </div>

              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                {showUpload ? "Hide Upload" : "Upload Files"}
              </button>
            </div>

            {showUpload && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <FileUpload onUploadComplete={handleUploadComplete} />

                {episodes.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {episodes.length}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          Ready to ingest
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          {episodes.length} episode
                          {episodes.length !== 1 ? "s" : ""} processed
                        </p>
                      </div>
                    </div>

                    <IngestButton
                      episodes={episodes}
                      onIngestComplete={handleIngestComplete}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-8 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Search Transcript
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ask anything and find relevant conversations instantly
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything about your transcripts..."
                    className="w-full px-6 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <kbd className="px-2 py-1 text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                      ⏎
                    </kbd>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 min-w-[140px] justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-3 animate-in slide-in-from-top duration-300">
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Search Results
                </h2>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 group hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {result.episodeTitle}
                        </h3>

                        {result.speaker && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                              {result.speaker}
                            </span>
                          </div>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                          result.score
                        )}`}
                      >
                        {formatScore(result.score)} match
                      </span>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {result.content}
                    </p>

                    {result.timestamp && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {result.timestamp}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && !loading && query && (
            <div className="text-center py-12 animate-in fade-in duration-500">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No matches found for "
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {query}
                  </span>
                  ". Try different keywords or check your uploaded content.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-20 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="flex items-center justify-center gap-2">
              Powered by
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Next.js
              </span>
              ,
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Pinecone
              </span>
              , and
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                OpenAI
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
