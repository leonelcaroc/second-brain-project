export interface TranscriptChunk {
  chunkId: string;
  episodeTitle: string;
  content: string;
  speaker?: string;
  timestamp?: string;
}

export interface Episode {
  title: string;
  transcript: string;
}

export function processTranscripts(episodes: Episode[]): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];

  episodes.forEach((episode, episodeIndex) => {
    if (!episode.transcript) {
      console.warn(`Episode ${episodeIndex} has no transcript`);
      return;
    }

    const episodeChunks = splitTranscriptIntoChunks(
      episode.transcript,
      episode.title
    );
    chunks.push(...episodeChunks);
  });

  return chunks;
}

function splitTranscriptIntoChunks(
  transcript: string,
  episodeTitle: string
): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];

  if (!transcript || typeof transcript !== "string") {
    console.warn("Invalid transcript provided");
    return chunks;
  }

  const sentences = transcript
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);

  let chunkContent = "";
  let chunkCount = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (
      chunkContent.length + trimmedSentence.length > 500 &&
      chunkContent.length > 0
    ) {
      chunks.push({
        chunkId: `${episodeTitle}-chunk-${chunkCount++}`,
        episodeTitle,
        content: chunkContent.trim(),
      });
      chunkContent = "";
    }

    chunkContent += trimmedSentence + ". ";
  }

  if (chunkContent.trim().length > 0) {
    chunks.push({
      chunkId: `${episodeTitle}-chunk-${chunkCount}`,
      episodeTitle,
      content: chunkContent.trim(),
    });
  }

  return chunks;
}
