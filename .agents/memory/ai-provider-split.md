---
name: AI provider split (Anthropic text / OpenAI audio)
description: Which provider powers what after the July 2026 migration, and the pause-flag semantics.
---

# AI provider split

Rule: ALL text/reasoning AI goes through `modelGateway` (Anthropic). OpenAI remains ONLY for audio — whisper-1 transcription and tts-1 speech.

**Why:** Full text migration to Claude was completed July 22, 2026; Anthropic has no audio APIs, so audio deliberately stays on OpenAI.

**How to apply:**
- Never add a direct `chat.completions.create` call — use `modelGateway.complete`/`completeJson` (tiers: reasoning/fast; env overrides MODEL_REASONING/MODEL_FAST).
- Pause flags are provider-scoped: `PAUSE_ANTHROPIC_API` gates text features; `PAUSE_OPENAI_API` gates audio (TTS/Whisper) only. Do not guard a text path with the OpenAI flag.
- Mixed files (aiService, avatarVoiceService, voiceAssistantService, streamConversationService) contain both: their text uses the gateway, their audio keeps the OpenAI client.
