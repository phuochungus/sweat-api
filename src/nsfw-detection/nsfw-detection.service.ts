import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface NSFWDetectionResult {
  label: string;
  score: number;
}

@Injectable()
export class NSFWDetectionService {
  private readonly huggingFaceToken: string;
  private readonly huggingFaceUrl: string;
  private readonly nsfwThreshold: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.huggingFaceToken = this.configService.get('HUGGING_FACE_TOKEN');
    this.huggingFaceUrl =
      'https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection';
    this.nsfwThreshold = 0.5; // Threshold for NSFW detection
  }

  async detectNSFW(imageUrl: string): Promise<NSFWDetectionResult[]> {
    try {
      // Fetch the image
      const imageResponse = await firstValueFrom(
        this.httpService.get(imageUrl, { responseType: 'arraybuffer' }),
      );

      // Send image to Hugging Face API
      const response = await firstValueFrom(
        this.httpService.post(this.huggingFaceUrl, imageResponse.data, {
          headers: {
            Authorization: `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'image/jpeg',
          },
        }),
      );

      const result: NSFWDetectionResult[] = response.data;
      return result;
    } catch (error) {
      console.error('NSFW detection error:', error);
      throw error;
    }
  }

  async checkImageNSFW(imageUrl: string): Promise<boolean> {
    try {
      const results = await this.detectNSFW(imageUrl);

      // Find NSFW score
      const nsfwResult = results.find(
        (result) => result.label.toLowerCase() === 'nsfw',
      );

      if (nsfwResult && nsfwResult.score > this.nsfwThreshold) {
        return true; // Image is NSFW
      }

      return false; // Image is safe
    } catch (error) {
      console.error('Error checking NSFW content:', error);
      // In case of error, we can choose to be conservative and block the image
      // or allow it through. For safety, let's allow it through if the service fails
      return false;
    }
  }

  async validateImagesForPost(imageUrls: string[]): Promise<void> {
    const nsfwChecks = await Promise.all(
      imageUrls.map(async (url) => {
        const isNSFW = await this.checkImageNSFW(url);
        return { url, isNSFW };
      }),
    );

    const nsfwImages = nsfwChecks.filter((check) => check.isNSFW);

    if (nsfwImages.length > 0) {
      throw new UnprocessableEntityException({
        message: 'Post contains inappropriate content and cannot be created',
        nsfwImages: nsfwImages.map((img) => img.url),
      });
    }
  }
}
