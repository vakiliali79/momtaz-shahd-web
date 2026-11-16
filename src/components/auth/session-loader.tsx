import { SessionBridge } from "@/components/auth/session-bridge";
import { getSessionUser } from "@/lib/session";

/** Reads the session on the server; render inside <Suspense>. */
export async function SessionLoader() {
  const user = await getSessionUser();
  return <SessionBridge user={user} />;
}
