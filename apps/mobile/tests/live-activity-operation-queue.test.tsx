import { expect, test } from "@jest/globals";
import { createLiveActivityOperationQueue } from "../src/live-activity/live-activity-operation-queue";

test("waits for the pending completion cleanup before restarting", async () => {
  const runOperation = createLiveActivityOperationQueue();
  const events: string[] = [];
  let finishCleanup = () => {};
  const cleanup = new Promise<void>((resolve) => {
    finishCleanup = resolve;
  });

  const end = runOperation(async () => {
    events.push("end started");
    await cleanup;
    events.push("end finished");
  });
  const start = runOperation(async () => {
    events.push("start");
  });

  await Promise.resolve();
  expect(events).toEqual(["end started"]);

  finishCleanup();
  await Promise.all([end, start]);

  expect(events).toEqual(["end started", "end finished", "start"]);
});

test("runs the next operation after a failure", async () => {
  const runOperation = createLiveActivityOperationQueue();
  const failedOperation = runOperation(async () => {
    throw new Error("Live Activity cleanup failed");
  });
  const nextOperation = runOperation(async () => true);

  await expect(failedOperation).rejects.toThrow("Live Activity cleanup failed");
  await expect(nextOperation).resolves.toBe(true);
});
