---
name: Caption extraction & client-side speech
description: Conventions after full OpenAI removal — transcription via yt-dlp captions, speech via Web Speech API
---
- Video transcription = yt-dlp caption extraction only (`captionExtractor`); no server-side audio transcription exists. Videos without captions must fail gracefully (NoCaptionsError 422 / failed summary with clear message), never invent transcripts.
- **Why:** OpenAI (Whisper/TTS) was removed entirely; Anthropic has no audio APIs.
- All speech output is client-side Web Speech API (SpeakButton / speechSynthesis). Server TTS endpoints return 410. Overlapping utterances need a request-ID guard so stale responses can't speak over newer ones.
- yt-dlp must be invoked with execFile + `--` arg separator, never a shell string — user URLs are attacker-controlled (shell injection).
