import { NextResponse } from "next/server";
import {
  FREE_DAILY_SCANS,
  todayKey,
  resolveUserAndPremium,
  readUserScanCount,
  readAnonScanCount,
} from "@/lib/entitlement";

export const dynamic = "force-dynamic";

// État du quota de scans et du statut premium, faisant autorité côté serveur.
// Le client s'y synchronise au chargement plutôt que de se fier à localStorage.
export async function GET() {
  try {
    const { user, isPremium } = await resolveUserAndPremium();
    const day = todayKey();
    const used = isPremium
      ? 0
      : user
        ? await readUserScanCount(user.id, day)
        : await readAnonScanCount(day);

    return NextResponse.json({
      isPremium,
      loggedIn: Boolean(user),
      scansUsed: used,
      scansRemaining: isPremium ? null : Math.max(0, FREE_DAILY_SCANS - used),
      limit: FREE_DAILY_SCANS,
    });
  } catch {
    return NextResponse.json(
      { isPremium: false, loggedIn: false, scansUsed: 0, scansRemaining: FREE_DAILY_SCANS, limit: FREE_DAILY_SCANS },
      { status: 200 },
    );
  }
}
