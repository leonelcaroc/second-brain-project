export interface SearchResult {
  score: number;
  content: string;
  episodeTitle: string;
  speaker?: string;
  timestamp?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
}

export interface IngestRequest {
  episodes: Episode[];
}

export interface Episode {
  title: string;
  transcript: string;
  speaker?: string;
  timestamp?: string;
}

export interface IngestResponse {
  success: boolean;
  message: string;
}

export interface StatusResponse {
  totalVectors: number;
  indexStats: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    namespaces: Record<string, any>;
    dimension: number;
    indexFullness: number;
    totalRecordCount: number;
  };
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string;
  success: string;
}
