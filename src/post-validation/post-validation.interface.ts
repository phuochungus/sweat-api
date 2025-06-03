export interface ValidationScores {
  content_safety: number;
  political_neutrality: number;
}

export interface ValidationResult {
  imageUrl: string;
  scores: ValidationScores;
}

export interface GeminiContentPart {
  inline_data?: {
    mime_type: string;
    data: string;
  };
  text?: string;
}

export interface GeminiRequest {
  contents: Array<{
    parts: GeminiContentPart[];
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}
