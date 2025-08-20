import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export interface ExtractedContent {
  audioPath: string;
  title: string;
  duration: number;
  description?: string;
  thumbnail?: string;
}

export class ContentExtractor {
  private static tempDir = join(tmpdir(), 'streamaix-content');

  /**
   * Initialize temporary directory
   */
  static async init(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create temp directory:', error);
    }
  }

  /**
   * Extract content from various platforms
   */
  static async extractContent(url: string): Promise<ExtractedContent> {
    await this.init();

    const platform = this.detectPlatform(url);
    
    switch (platform) {
      case 'youtube':
        return this.extractFromYouTube(url);
      case 'spotify':
        return this.extractFromSpotify(url);
      case 'soundcloud':
        return this.extractFromSoundCloud(url);
      case 'twitch':
        return this.extractFromTwitch(url);
      default:
        return this.extractGeneric(url);
    }
  }

  /**
   * Detect platform from URL
   */
  private static detectPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('twitch.tv')) return 'twitch';
    if (url.includes('podcasts.apple.com')) return 'apple';
    if (url.includes('open.spotify.com/episode')) return 'spotify';
    return 'generic';
  }

  /**
   * Extract from YouTube using yt-dlp
   */
  private static async extractFromYouTube(url: string): Promise<ExtractedContent> {
    const outputPath = join(this.tempDir, `youtube_${Date.now()}.mp3`);
    
    return new Promise((resolve, reject) => {
      const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" --print "title:%(title)s" --print "duration:%(duration)s" --print "description:%(description)s" "${url}"`;
      
      exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('YouTube extraction failed:', error);
          reject(new Error(`YouTube extraction failed: ${error.message}`));
          return;
        }

        try {
          const lines = stdout.trim().split('\n');
          const titleLine = lines.find(line => line.startsWith('title:'));
          const durationLine = lines.find(line => line.startsWith('duration:'));
          const descriptionLine = lines.find(line => line.startsWith('description:'));
          
          const title = titleLine?.replace('title:', '') || 'Unknown Title';
          const duration = parseFloat(durationLine?.replace('duration:', '') || '0');
          const description = descriptionLine?.replace('description:', '') || '';

          resolve({
            audioPath: outputPath,
            title,
            duration,
            description
          });
        } catch (parseError) {
          reject(new Error(`Failed to parse YouTube metadata: ${parseError}`));
        }
      });
    });
  }

  /**
   * Extract from Spotify (requires special handling)
   */
  private static async extractFromSpotify(url: string): Promise<ExtractedContent> {
    // Note: Spotify doesn't allow direct audio extraction due to DRM
    // This would require Spotify Web API integration for metadata only
    throw new Error('Spotify content extraction requires premium API access and does not support audio extraction due to DRM protection.');
  }

  /**
   * Extract from SoundCloud
   */
  private static async extractFromSoundCloud(url: string): Promise<ExtractedContent> {
    const outputPath = join(this.tempDir, `soundcloud_${Date.now()}.mp3`);
    
    return new Promise((resolve, reject) => {
      const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" --print "title:%(title)s" --print "duration:%(duration)s" "${url}"`;
      
      exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('SoundCloud extraction failed:', error);
          reject(new Error(`SoundCloud extraction failed: ${error.message}`));
          return;
        }

        const lines = stdout.trim().split('\n');
        const titleLine = lines.find(line => line.startsWith('title:'));
        const durationLine = lines.find(line => line.startsWith('duration:'));
        
        const title = titleLine?.replace('title:', '') || 'Unknown Title';
        const duration = parseFloat(durationLine?.replace('duration:', '') || '0');

        resolve({
          audioPath: outputPath,
          title,
          duration
        });
      });
    });
  }

  /**
   * Extract from Twitch
   */
  private static async extractFromTwitch(url: string): Promise<ExtractedContent> {
    const outputPath = join(this.tempDir, `twitch_${Date.now()}.mp3`);
    
    return new Promise((resolve, reject) => {
      const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" --print "title:%(title)s" --print "duration:%(duration)s" "${url}"`;
      
      exec(command, { timeout: 600000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('Twitch extraction failed:', error);
          reject(new Error(`Twitch extraction failed: ${error.message}`));
          return;
        }

        const lines = stdout.trim().split('\n');
        const titleLine = lines.find(line => line.startsWith('title:'));
        const durationLine = lines.find(line => line.startsWith('duration:'));
        
        const title = titleLine?.replace('title:', '') || 'Unknown Title';
        const duration = parseFloat(durationLine?.replace('duration:', '') || '0');

        resolve({
          audioPath: outputPath,
          title,
          duration
        });
      });
    });
  }

  /**
   * Generic extraction for other platforms
   */
  private static async extractGeneric(url: string): Promise<ExtractedContent> {
    const outputPath = join(this.tempDir, `generic_${Date.now()}.mp3`);
    
    return new Promise((resolve, reject) => {
      const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" --print "title:%(title)s" --print "duration:%(duration)s" "${url}"`;
      
      exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('Generic extraction failed:', error);
          reject(new Error(`Content extraction failed: ${error.message}. This URL may not be supported or may require special permissions.`));
          return;
        }

        const lines = stdout.trim().split('\n');
        const titleLine = lines.find(line => line.startsWith('title:'));
        const durationLine = lines.find(line => line.startsWith('duration:'));
        
        const title = titleLine?.replace('title:', '') || 'Unknown Title';
        const duration = parseFloat(durationLine?.replace('duration:', '') || '0');

        resolve({
          audioPath: outputPath,
          title,
          duration
        });
      });
    });
  }

  /**
   * Clean up temporary files
   */
  static async cleanup(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Failed to cleanup file:', filePath, error);
    }
  }

  /**
   * Get supported platforms
   */
  static getSupportedPlatforms(): string[] {
    return [
      'YouTube (youtube.com, youtu.be)',
      'SoundCloud (soundcloud.com)',
      'Twitch (twitch.tv)',
      'Vimeo (vimeo.com)',
      'Dailymotion (dailymotion.com)',
      'Apple Podcasts (podcasts.apple.com)',
      'Google Podcasts',
      'Most podcast RSS feeds',
      'Direct audio/video URLs'
    ];
  }
}