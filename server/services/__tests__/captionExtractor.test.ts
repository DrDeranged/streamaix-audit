import { describe, it, expect } from "vitest";
import { parseCaptionsToTranscript, NoCaptionsError } from "../captionExtractor";

const VTT_FIXTURE = `WEBVTT
Kind: captions
Language: en

00:00:00.000 --> 00:00:02.500 align:start position:0%
Welcome back to the channel

00:00:02.500 --> 00:00:05.000
Welcome back to the channel
today we're talking about Bitcoin

00:00:05.000 --> 00:00:08.000
today we're talking about Bitcoin
and the <c>current</c> market cycle
`;

const SRT_FIXTURE = `1
00:00:00,000 --> 00:00:02,500
Hello world

2
00:00:02,500 --> 00:00:05,000
this is an SRT caption file
`;

describe("parseCaptionsToTranscript", () => {
  it("parses VTT: strips headers, timestamps, cue settings, and inline tags", () => {
    const out = parseCaptionsToTranscript(VTT_FIXTURE);
    expect(out).toContain("Welcome back to the channel");
    expect(out).toContain("today we're talking about Bitcoin");
    expect(out).toContain("current market cycle");
    expect(out).not.toContain("WEBVTT");
    expect(out).not.toContain("-->");
    expect(out).not.toContain("<c>");
    expect(out).not.toContain("align:start");
  });

  it("collapses the rolling duplicate lines auto-captions produce", () => {
    const out = parseCaptionsToTranscript(VTT_FIXTURE);
    const occurrences = out.split("Welcome back to the channel").length - 1;
    expect(occurrences).toBe(1);
  });

  it("parses SRT: strips sequence numbers and timestamps", () => {
    const out = parseCaptionsToTranscript(SRT_FIXTURE);
    expect(out).toContain("Hello world");
    expect(out).toContain("this is an SRT caption file");
    expect(out).not.toMatch(/^\d+$/m);
    expect(out).not.toContain("-->");
  });

  it("returns empty string for caption files with no text", () => {
    expect(parseCaptionsToTranscript("WEBVTT\n\n").trim()).toBe("");
  });
});

describe("NoCaptionsError", () => {
  it("carries a 422 statusCode and a graceful user-facing message", () => {
    const err = new NoCaptionsError();
    expect(err.statusCode).toBe(422);
    expect(err.message).toMatch(/no captions/i);
  });
});
