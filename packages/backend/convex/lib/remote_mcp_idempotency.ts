import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export const REMOTE_MCP_REQUEST_RETENTION_MS = 24 * 60 * 60 * 1000;

type RemoteMcpRequestTable =
  | "remoteMcpHabitRequests"
  | "remoteMcpCommitRequests"
  | "remoteMcpRerevealRequests";

interface RemoteMcpRequestDoc {
  _id: Id<RemoteMcpRequestTable>;
}

export const findLiveRemoteMcpRequest = async <
  Request extends RemoteMcpRequestDoc,
>(
  ctx: MutationCtx,
  expiredRequests: Request[],
  findExisting: () => Promise<Request | null>,
) => {
  await Promise.all(
    expiredRequests.map((request) => ctx.db.delete(request._id)),
  );

  return await findExisting();
};
