import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./services/serverErrorRecorder", () => ({
  recordServerErrorSafe: vi.fn(),
  pruneOldServerErrors: vi.fn(async () => 0),
}));

import {
  __resetLifecycleForTests,
  installLifecycleHooks,
} from "./lifecycle";

describe("lifecycle installation", () => {
  beforeEach(() => {
    __resetLifecycleForTests();
  });

  it("installs once and emits one deployment-visible marker", () => {
    const on = vi.spyOn(process, "on").mockImplementation(() => process);
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const server = {} as any;

    installLifecycleHooks(server);
    installLifecycleHooks(server);

    expect(info).toHaveBeenCalledExactlyOnceWith(
      "[lifecycle] installed: process-errors=on signals=SIGTERM,SIGINT scheduler-jobs=post-ready",
    );
    expect(on.mock.calls.map((call) => call[0])).toEqual([
      "uncaughtException",
      "unhandledRejection",
      "SIGTERM",
      "SIGINT",
    ]);
    on.mockRestore();
    info.mockRestore();
  });
});