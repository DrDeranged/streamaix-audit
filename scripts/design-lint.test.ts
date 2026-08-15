import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

// Fixture tests for scripts/design-lint.sh — verifies the banned-class grep
// fires on raw semantic color utilities (positive direction) and passes on
// design-token classes (negative direction). The script accepts a lint dir
// as $1 (default client/src); fixtures live under the repo root so relative
// paths work after the script's own `cd`.

const repoRoot = join(__dirname, "..");
let fixtureRoot: string;

function runLint(dir: string): { code: number; out: string } {
  try {
    const out = execFileSync("bash", ["scripts/design-lint.sh", relative(repoRoot, dir)], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    return { code: 0, out };
  } catch (e: any) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

function fixture(name: string, content: string): string {
  const dir = join(fixtureRoot, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "Fixture.tsx"), content);
  return dir;
}

beforeAll(() => {
  // Must be inside the repo so the relative path survives the script's cd.
  fixtureRoot = mkdtempSync(join(repoRoot, ".design-lint-fixtures-"));
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("design-lint banned classes (positive: must fail)", () => {
  const banned = [
    `<div className="text-red-500" />`,
    `<div className="bg-emerald-600/20" />`,
    `<div className="border-amber-400" />`,
    `<div className="ring-cyan-500" />`,
    `<div className="shadow-blue-500/50" />`,
    `<div className="divide-y divide-slate-700/30" />`,
    `<input className="accent-red-500" />`,
    `<div className="ring-offset-slate-950" />`,
    `<svg className="fill-green-500 stroke-yellow-400" />`,
    `<div className="bg-gradient-to-r from-cyan-500 to-blue-600" />`,
    `<p className="decoration-pink-400 placeholder-gray-500" />`,
    `<div className="rounded-lg" />`,
  ];
  banned.forEach((snippet, i) => {
    it(`flags: ${snippet.slice(15, 60)}`, () => {
      const dir = fixture(`banned-${i}`, snippet);
      const r = runLint(dir);
      expect(r.code, r.out).toBe(1);
      expect(r.out).toContain("banned classes found");
    });
  });
});

describe("design-lint token classes (negative: must pass)", () => {
  const allowed = [
    `<div className="text-loss bg-ink-surface border-ink-edge" />`,
    `<div className="text-gain ring-accent-core shadow-none" />`,
    `<div className="divide-y divide-ink-divider" />`,
    `<input className="accent-loss" />`,
    `<div className="ring-offset-2 ring-offset-ink-page" />`,
    `<div className="text-warn bg-ink-raised rounded-2xl" />`,
    `<div data-motion="data-[motion=from-end]:slide-in" className="rounded-xl" />`,
  ];
  allowed.forEach((snippet, i) => {
    it(`passes: ${snippet.slice(15, 60)}`, () => {
      const dir = fixture(`allowed-${i}`, snippet);
      const r = runLint(dir);
      expect(r.code, r.out).toBe(0);
      expect(r.out).toContain("design:lint passed");
    });
  });
});
