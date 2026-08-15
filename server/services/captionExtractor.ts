import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Caption-based transcript extraction (zero-cost replacement for Whisper).
 *
 * Uses yt-dlp to download human subtitles (preferred) or auto-generated
 * captions and parses the VTT/SRT into the same plain-transcript shape the
 * Whisper pipeline produced, so everything downstream is unchanged.
 *
 * If a video has no captions in any handled language, throws
 * NoCaptionsError with a clear user-facing message — never a crash, never an
 * invented transcript.
 */

export class NoCaptionsError extends Error {
  readonly statusCode = 422;
  constructor(message = 'This video has no captions available to summarize') {
    super(message);
    this.name = 'NoCaptionsError';
  }
}

/** Languages we try, in order. "en.*" also matches en-US / en-GB / en-orig. */
const SUB_LANGS = 'en.*,en';

const YTDLP_TIMEOUT_MS = 120_000;

function execFileP(file: string, args: string[], timeout = YTDLP_TIMEOUT_MS): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    // execFile (not exec): no shell is involved, so URL contents can never be
    // interpreted as shell syntax ($(...), backticks, ;, etc.).
    execFile(file, args, { timeout, maxBuffer: 32 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(Object.assign(error, { stdout, stderr }));
      else resolve({ stdout, stderr });
    });
  });
}

/**
 * Parse WebVTT or SRT caption content into a clean transcript string:
 * strips headers, cue timestamps, cue settings, inline tags, and collapses
 * the consecutive-duplicate lines auto-captions produce.
 */
export function parseCaptionsToTranscript(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  let last = '';
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^WEBVTT/i.test(trimmed)) continue;
    if (/^(Kind|Language|NOTE|STYLE|REGION)\b/i.test(trimmed)) continue;
    // Cue timing lines (VTT "00:00:01.000 --> 00:00:03.000 align:start" or SRT "00:00:01,000 --> ...")
    if (/-->/.test(trimmed)) continue;
    // SRT sequence numbers / bare cue identifiers
    if (/^\d+$/.test(trimmed)) continue;
    // Strip inline tags: <c>, </c>, <00:00:01.000>, <i>, etc.
    let text = trimmed.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    // Decode the few entities captions actually use
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');
    if (!text) continue;
    // Auto-captions repeat rolling lines — drop exact consecutive duplicates
    // and lines fully contained in the previous line (rolling-window overlap).
    if (text === last) continue;
    if (last && last.includes(text)) continue;
    if (last && text.includes(last) && out.length > 0) {
      // Current line extends the previous rolling line — replace it.
      out[out.length - 1] = text;
      last = text;
      continue;
    }
    out.push(text);
    last = text;
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

export interface CaptionTranscript {
  transcript: string;
  duration: number;
  language: string;
}

/**
 * Extract a transcript for a video URL from its captions.
 * Prefers human-authored subtitles over auto-generated ones.
 */
export async function extractCaptionTranscript(videoUrl: string): Promise<CaptionTranscript> {
  const workDir = join(tmpdir(), `streamaix-captions-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
  await fs.mkdir(workDir, { recursive: true });
  const outTemplate = join(workDir, 'media');

  try {
    // --write-subs (human) AND --write-auto-subs (fallback); yt-dlp prefers
    // human subs when both exist for a requested language.
    // Only http(s) URLs are ever handed to yt-dlp.
    let parsed: URL;
    try {
      parsed = new URL(videoUrl);
    } catch {
      throw new NoCaptionsError('Invalid video URL');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new NoCaptionsError('Only http(s) video URLs are supported');
    }

    const args = [
      '--skip-download', '--write-subs', '--write-auto-subs',
      '--sub-langs', SUB_LANGS, '--sub-format', 'vtt/srt/best',
      '--print-to-file', 'duration', join(workDir, 'duration.txt'),
      '-o', outTemplate,
      '--', parsed.toString(),
    ];

    try {
      await execFileP('yt-dlp', args);
    } catch (err) {
      // yt-dlp exits non-zero for unavailable videos; caption absence usually
      // still exits 0. Either way, decide based on what landed on disk.
      console.warn('[captions] yt-dlp exited non-zero:', (err as Error).message?.slice(0, 300));
    }

    const files = await fs.readdir(workDir).catch(() => [] as string[]);
    const captionFiles = files
      .filter((f) => /\.(vtt|srt)$/i.test(f))
      // Prefer human subs: yt-dlp names auto captions with the same pattern, but
      // when both were written the non-".en-orig"/plain-language one is human.
      .sort((a, b) => a.length - b.length);

    if (captionFiles.length === 0) {
      throw new NoCaptionsError();
    }

    const captionPath = join(workDir, captionFiles[0]);
    const rawCaptions = await fs.readFile(captionPath, 'utf-8');
    const transcript = parseCaptionsToTranscript(rawCaptions);
    if (!transcript || transcript.length < 10) {
      throw new NoCaptionsError();
    }

    let duration = 0;
    try {
      const durRaw = await fs.readFile(join(workDir, 'duration.txt'), 'utf-8');
      duration = Math.round(parseFloat(durRaw.trim().split(/\r?\n/).pop() || '0')) || 0;
    } catch {
      duration = 0;
    }

    const langMatch = captionFiles[0].match(/\.([a-zA-Z-]+)\.(vtt|srt)$/);
    const language = (langMatch?.[1] || 'en').split('-')[0];

    return { transcript, duration, language };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
