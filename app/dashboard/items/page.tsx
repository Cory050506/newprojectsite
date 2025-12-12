"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { sendAlertEmail } from "@/lib/email";
import { PLANS } from "@/lib/plans";

type ItemDoc = {
  id: string;
  name: string;
  vendor?: string;
  daysLast: number;
  createdAt?: any;
};

export default function ItemsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<keyof typeof PLANS>("basic");
  const [items, setItems] = useState<ItemDoc[]>([]);
  const [alertedStatus, setAlertedStatus] = useState<Record<string, "low" | "out">>({});

  // ADD MODAL
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [daysLast, setDaysLast] = useState("");
  const [vendor, setVendor] = useState("");

  // ============================
  // AUTH + DATA
  // ============================
  useEffect(() => {
    let unsubItems: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      // Load user plan
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      const rawPlan = userSnap.data()?.plan;

if (rawPlan && rawPlan in PLANS) {
  setPlan(rawPlan as keyof typeof PLANS);
} else {
  setPlan("basic");
}

      // Items listener
      unsubItems = onSnapshot(
        collection(db, "users", currentUser.uid, "items"),
        (snap) => {
          const itemsData = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          })) as ItemDoc[];

          setItems(itemsData);

          // Email alerts
          itemsData.forEach((item) => {
            if (!item.createdAt || !currentUser.email) return;

            const created = item.createdAt.toDate();
            const diffDays = Math.floor((Date.now() - created.getTime()) / 86400000);
            const daysLeft = Math.max(item.daysLast - diffDays, 0);

            let status: "ok" | "low" | "out" = "ok";
            if (daysLeft <= 0) status = "out";
            else if (daysLeft <= 3) status = "low";

            if (status === "ok") return;
            if (alertedStatus[item.id] === status) return;

            sendAlertEmail({
              toEmail: currentUser.email,
              toName: currentUser.displayName || "there",
              subject:
                status === "out"
                  ? `🚨 ${item.name} is OUT`
                  : `⚠️ ${item.name} is running low`,
              message:
                status === "out"
                  ? `${item.name} has run out and needs immediate restocking.`
                  : `${item.name} will run out soon.`,
            });

            setAlertedStatus((prev) => ({ ...prev, [item.id]: status }));
          });
        }
      );
    });

    return () => {
      unsubAuth();
      unsubItems?.();
    };
  }, [router]);

  // ============================
  // PLAN LIMITS (FIXED)
  // ============================
  const planConfig = PLANS[plan];

const itemLimit =
  "limits" in planConfig
    ? planConfig.limits.items
    : Infinity;

const hasItemLimit = itemLimit !== Infinity;
const atItemLimit = hasItemLimit && items.length >= itemLimit;
  // ============================
  // ADD ITEM
  // ============================
  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (atItemLimit) {
      alert("You’ve reached your plan’s item limit. Upgrade to add more.");
      return;
    }

    await addDoc(collection(db, "users", user.uid, "items"), {
      name,
      vendor,
      daysLast: Number(daysLast),
      createdAt: serverTimestamp(),
    });

    setName("");
    setDaysLast("");
    setVendor("");
    setShowAdd(false);
  }

  // ============================
  // UI
  // ============================
  return (
    <motion.div className="p-10 flex-1">
      <h1 className="text-3xl font-bold">Items</h1>

      {atItemLimit && (
        <div className="mt-4 p-4 rounded-lg bg-amber-100 text-amber-800">
          You’ve reached your <strong>{PLANS[plan].name}</strong> plan limit
          {hasItemLimit && ` (${itemLimit} items)`}.
          <a href="/pricing" className="ml-2 underline font-medium">
            Upgrade
          </a>
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Items</h2>
        <button
          disabled={atItemLimit}
          onClick={() => setShowAdd(true)}
          className={`px-4 py-2 rounded-lg text-white ${
            atItemLimit ? "bg-gray-400 cursor-not-allowed" : "bg-sky-600"
          }`}
        >
          + Add Item
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="p-4 border rounded-lg flex justify-between">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-500">
                Vendor: {item.vendor || "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddItem}
            className="bg-white rounded-xl p-6 w-full max-w-md space-y-4"
          >
            <h2 className="text-xl font-semibold">Add Item</h2>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
              className="w-full border p-3 rounded-lg"
              required
            />

            <input
              type="number"
              value={daysLast}
              onChange={(e) => setDaysLast(e.target.value)}
              placeholder="Days it lasts"
              className="w-full border p-3 rounded-lg"
              required
            />

            <input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Vendor"
              className="w-full border p-3 rounded-lg"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="w-1/2 border p-3 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-sky-600 text-white p-3 rounded-lg"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
}