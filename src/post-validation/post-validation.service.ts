import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  ValidationScores,
  ValidationResult,
  GeminiRequest,
  GeminiResponse,
} from './post-validation.interface';

@Injectable()
export class PostValidationService {
  private readonly geminiApiKey: string;
  private readonly geminiApiUrl: string;
  private readonly logger = new Logger(PostValidationService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.geminiApiKey = this.configService.get('GEMINI_API_KEY');
    this.geminiApiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
  }
  /**
   * Validates an image post using the Gemini API
   * @param imageUrl The URL of the image to validate (string or array of strings), optional for text-only posts
   * @param caption Optional text caption for the post
   * @returns The validation scores for each image or text-only post
   */
  async validatePost(
    imageUrl?: string | string[] | null,
    caption?: string,
  ): Promise<ValidationScores | ValidationResult[]> {
    // Handle text-only posts (no image)
    if (!imageUrl || (Array.isArray(imageUrl) && imageUrl.length === 0)) {
      if (!caption || caption.trim() === '') {
        throw new Error('Post must contain either image or text content');
      }
      return this.validateTextOnlyPost(caption);
    }

    // Handle single string case
    if (typeof imageUrl === 'string') {
      return this.validateSingleImage(imageUrl, caption);
    }

    // Handle array of URLs
    const results = await Promise.all(
      imageUrl.map(async (url) => {
        try {
          const scores = await this.validateSingleImage(url, caption);
          return { imageUrl: url, scores };
        } catch (error) {
          this.logger.error(`Error validating image ${url}:`, error);
          return {
            imageUrl: url,
            scores: {
              content_safety: 0,
              political_neutrality: 0,
              sport_relevance: 0,
            },
          };
        }
      }),
    );

    return results;
  }

  /**
   * Validates a single image using the Gemini API
   * @param imageUrl The URL of the image to validate
   * @param caption Optional text caption for the post
   * @returns The validation scores
   */
  private async validateSingleImage(
    imageUrl: string,
    caption?: string,
  ): Promise<ValidationScores> {
    try {
      // Fetch the image
      const imageResponse = await firstValueFrom(
        this.httpService.get(imageUrl, { responseType: 'arraybuffer' }),
      );

      // Convert the image to base64
      const base64Image = Buffer.from(imageResponse.data).toString('base64');

      // Prepare the validation prompt
      const promptText = `Analyze this post ${
        caption ? 'with caption: "' + caption + '"' : ''
      } and return JSON with scores 0-1.

Expected format:
{
"sport_relevance":0.0,
"content_safety":0.0,
"political_neutrality":0.0
}

Scoring:
-sport_relevance:0=not sports related,1=sports content
-content_safety:0=toxic/inappropriate,1=safe/clean
-political_neutrality:1=non-political,0=political content

IMPORTANT:Return ONLY the JSON object.No markdown,no code blocks,no explanation.Start your response with { and end with }.`;

      // Create the request payload
      const requestPayload: GeminiRequest = {
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                text: promptText,
              },
            ],
          },
        ],
      };

      // Send the request to Gemini API
      const response = await firstValueFrom(
        this.httpService.post<GeminiResponse>(
          `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
          requestPayload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Parse the response
      const responseText = response.data.candidates[0].content.parts[0].text;
      const scores = JSON.parse(
        this.cleanString(responseText),
      ) as ValidationScores;

      return scores;
    } catch (error) {
      this.logger.error('Post validation error:', error);
      throw error;
    }
  }

  /**
   * Validates a text-only post using the Gemini API
   * @param text The text content of the post
   * @returns The validation scores
   */
  private async validateTextOnlyPost(text: string): Promise<ValidationScores> {
    try {
      // Prepare the validation prompt for text-only content
      const promptText = `Analyze this text post with content: "${text}" and return JSON with scores 0-1.

Expected format:
{
"sport_relevance":0.0,
"content_safety":0.0,
"political_neutrality":0.0
}

Scoring:
-sport_relevance:0=not sports related,1=sports content
-content_safety:0=toxic/inappropriate,1=safe/clean
-political_neutrality:1=non-political,0=political content

IMPORTANT:Return ONLY the JSON object.No markdown,no code blocks,no explanation.Start your response with { and end with }.`;

      // Create the request payload for text-only content
      const requestPayload: GeminiRequest = {
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
      };

      // Send the request to Gemini API
      const response = await firstValueFrom(
        this.httpService.post<GeminiResponse>(
          `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
          requestPayload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Parse the response
      console.log(
        'Raw response for text post:',
        JSON.stringify(response.data, null, 2),
      );
      const responseText = response.data.candidates[0].content.parts[0].text;
      const scores = JSON.parse(
        this.cleanString(responseText),
      ) as ValidationScores;

      return scores;
    } catch (error) {
      this.logger.error('Text-only post validation error:', error);
      throw error;
    }
  }

  /**
   * Validates a post against minimum required scores
   * @param scores The validation scores
   * @returns void, throws exception if validation fails
   */
  validateScores(scores: ValidationScores): void {
    const minSportRelevance = 0.1; // Minimum sport relevance score
    const minContentSafety = 0.7; // Minimum content safety score
    const minPoliticalNeutrality = 0.8; // Minimum political neutrality score (high is better)

    if (scores.political_neutrality < minPoliticalNeutrality) {
      throw new UnprocessableEntityException({
        message: 'Nội dung có tính chất chính trị quá cao',
        code: 'POLITICAL_NEUTRALITY',
      });
    }

    if (scores.content_safety < minContentSafety) {
      throw new UnprocessableEntityException({
        message: 'Nội dung chứa tài liệu không phù hợp hoặc không an toàn',
        code: 'CONTENT_SAFETY',
      });
    }

    if (scores.sport_relevance < minSportRelevance) {
      throw new UnprocessableEntityException({
        message: 'Nội dung không liên quan đến thể thao',
        code: 'SPORT_RELEVANCE',
      });
    }
  }
  /**
   * Helper method to validate a post and check its scores
   * @param imageUrl The URL of the image(s) to validate, optional for text-only posts
   * @param caption Optional text caption for the post
   * @returns The validation scores if validation passes
   */
  async validateAndCheckPost(
    imageUrl?: string | string[] | null,
    caption?: string,
  ): Promise<ValidationScores | ValidationResult[]> {
    // Ensure at least one of imageUrl or caption is provided
    if (
      (!imageUrl || (Array.isArray(imageUrl) && imageUrl.length === 0)) &&
      (!caption || caption.trim() === '')
    ) {
      throw new Error('Post must contain either image or text content');
    }

    const results = await this.validatePost(imageUrl, caption);
    console.log('Post validation results:', results);

    // Single image case or text-only post
    if (!Array.isArray(results)) {
      this.validateScores(results);
      return results;
    }

    // Multiple images case
    const failedValidations: { imageUrl: string; issues: string[] }[] = [];

    // Check each image's scores
    results.forEach((result) => {
      this.validateScores(result.scores);
    });

    // If any image failed validation, throw exception
    if (failedValidations.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Post validation failed for one or more images',
        failedValidations,
      });
    }

    return results;
  }

  cleanString(inputString: string): string {
    const cleanedString = inputString
      .replace(/^```json\n/, '') // Remove opening ```json\n
      .replace(/\n```$/, '') // Remove closing \n```
      .replace(/\n/g, ''); // Remove all remaining newlines
    return cleanedString;
  }
}
