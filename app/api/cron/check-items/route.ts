import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { Resend } from "resend";
import { Timestamp } from "firebase-admin/firestore";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const usersSnap = await db.collection("users").get();
  const now = new Date();

  let emailsSent = 0;

  for (const userDoc of usersSnap.docs) {
    const user = userDoc.data();
    if (!user.email || !user.orgId) continue;

    // 🔒 Get org + plan
    const orgSnap = await db
      .collection("organizations")
      .doc(user.orgId)
      .get();

    const plan = orgSnap.data()?.plan ?? "basic";
    if (!["pro", "premium", "enterprise"].includes(plan)) continue;

    const itemsSnap = await db
      .collection("users")
      .doc(userDoc.id)
      .collection("items")
      .get();

    for (const itemDoc of itemsSnap.docs) {
      const item = itemDoc.data();
      if (!item.createdAt || !item.daysLast) continue;

      const created = item.createdAt.toDate();
      const diffDays = Math.floor(
        (now.getTime() - created.getTime()) / 86400000
      );
      const daysLeft = item.daysLast - diffDays;

      if (daysLeft > 3) continue;

      // 🚫 Prevent duplicate alerts (24h cooldown)
      const lastAlert = item.lastAlertSentAt?.toDate?.();
      if (lastAlert) {
        const hoursSince =
          (now.getTime() - lastAlert.getTime()) / 3600000;
        if (hoursSince < 24) continue;
      }

      const subject =
        daysLeft <= 0
          ? `🚨 ${item.name} is OUT`
          : `⚠️ ${item.name} is running low`;

      const message =
        daysLeft <= 0
          ? `${item.name} has run out and needs restocking.`
          : `${item.name} will run out in ${daysLeft} days.`;

      await resend.emails.send({
        from: "Restok <alerts@getrestok.com>",
        to: user.email,
        subject,
        html: `
          <h2>${subject}</h2>
          <p>${message}</p>
          <a href="https://getrestok.com/dashboard/restock"
             style="display:inline-block;margin-top:12px;padding:10px 14px;
             background:#0ea5e9;color:white;border-radius:6px;text-decoration:none">
            Review items
          </a>
        `,
      });

      await itemDoc.ref.update({
        lastAlertSentAt: Timestamp.now(),
      });

      emailsSent++;
    }
  }

  return NextResponse.json({ success: true, emailsSent });
}