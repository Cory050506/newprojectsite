"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { sendAlertEmail } from "@/lib/email"; // keep if your alias works

type ItemDoc = {
  id: string;
  name: string;
  vendor?: string;
  daysLast: number;
  createdAt?: any; // Firestore Timestamp
};

export default function ItemsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<ItemDoc[]>([]);

  // MODALS
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // FIELDS
  const [name, setName] = useState("");
  const [daysLast, setDaysLast] = useState("");
  const [vendor, setVendor] = useState("");

  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Track status we already emailed for each item id: "low" | "out"
  const [alertedStatus, setAlertedStatus] = useState<Record<string, "low" | "out">>({});

  // AUTH + FETCH + ALERTS
  useEffect(() => {
    let unsubItems: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      unsubItems = onSnapshot(
        collection(db, "users", currentUser.uid, "items"),
        (snap) => {
          const itemsData: ItemDoc[] = snap.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              name: data.name,
              vendor: data.vendor,
              daysLast: Number(data.daysLast ?? 0),
              createdAt: data.createdAt,
            };
          });

          // Update UI list
          setItems(itemsData);

          // Email logic: only when status transitions to low/out
          itemsData.forEach((item) => {
            if (!item.createdAt) return;
            if (!currentUser.email) return;

            const created = item.createdAt.toDate();
            const diffDays = Math.floor((Date.now() - created.getTime()) / 86400000);
            const daysLeft = Math.max(item.daysLast - diffDays, 0);

            let status: "ok" | "low" | "out" = "ok";
            if (daysLeft <= 0) status = "out";
            else if (daysLeft <= 3) status = "low";

            if (status === "ok") return;

            // If we've already emailed for this status, do nothing
            if (alertedStatus[item.id] === status) return;

            // Send alert email
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
                  : `${item.name} will run out in ${daysLeft} day(s).`,
            });

            // Mark as alerted in memory to prevent spam
            setAlertedStatus((prev) => ({ ...prev, [item.id]: status }));
          });
        }
      );
    });

    return () => {
      unsubAuth();
      unsubItems?.();
    };
  }, [router, alertedStatus]);

  // STATUS BADGE (UI ONLY, NO SIDE EFFECTS)
  function getStatus(item: ItemDoc) {
    if (!item.createdAt) return null;

    const created = item.createdAt.toDate();
    const diff = Math.floor((Date.now() - created.getTime()) / 86400000);
    const daysLeft = item.daysLast - diff;

    if (daysLeft <= 0)
      return {
        label: "Due Today",
        color: "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200",
        daysLeft: 0,
      };

    if (daysLeft <= 3)
      return {
        label: "Running Low",
        color: "bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200",
        daysLeft,
      };

    return {
      label: "OK",
      color: "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200",
      daysLeft,
    };
  }

  // ADD ITEM
  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    await addDoc(collection(db, "users", user.uid, "items"), {
      name,
      daysLast: Number(daysLast),
      vendor,
      createdAt: serverTimestamp(),
    });

    setName("");
    setDaysLast("");
    setVendor("");
    setShowAdd(false);
  }

  // EDIT ITEM
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !editItem) return;

    await updateDoc(doc(db, "users", user.uid, "items", editItem.id), {
      name: editItem.name,
      daysLast: Number(editItem.daysLast),
      vendor: editItem.vendor,
    });

    setShowEdit(false);
    setEditItem(null);
  }

  // DELETE ITEM
  async function handleDeleteItem(id: string | null) {
    if (!user || !id) return;
    await deleteDoc(doc(db, "users", user.uid, "items", id));

    // clean alert memory
    setAlertedStatus((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  // REFILL — resets createdAt and clears alert memory so it can alert again later
  async function handleRefillItem(id: string) {
    if (!user) return;

    await updateDoc(doc(db, "users", user.uid, "items", id), {
      createdAt: serverTimestamp(),
    });

    setAlertedStatus((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  return (
    <motion.div
      className="p-10 flex-1 text-slate-800 dark:text-slate-100"
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-3xl font-bold">Items</h1>

      {/* ITEMS PANEL */}
      <motion.div
        className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Items</h2>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAdd(true)}
            className="bg-sky-600 text-white px-4 py-2 rounded-lg"
          >
            + Add Item
          </motion.button>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const status = getStatus(item);

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 border dark:border-slate-600 rounded-lg flex justify-between items-center bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
              >
                <div>
                  <h3 className="font-semibold">{item.name}</h3>

                  {status && (
                    <span className={`mt-1 inline-block px-2 py-1 text-xs rounded ${status.color}`}>
                      {status.label} • {status.daysLeft} days left
                    </span>
                  )}

                  <p className="text-slate-500 dark:text-slate-300 text-sm mt-2">
                    From: {item.vendor || "—"} <br />
                    Last refilled:{" "}
                    {item.createdAt ? item.createdAt.toDate().toLocaleDateString() : "Unknown"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setEditItem(item);
                      setShowEdit(true);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md"
                  >
                    Edit
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setDeleteItemId(item.id);
                      setShowDelete(true);
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded-md"
                  >
                    Delete
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleRefillItem(item.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md"
                  >
                    Refill
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl p-6 shadow"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold">Add Item</h2>

              <form onSubmit={handleAddItem} className="space-y-4 mt-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Item Name"
                  className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-3 rounded-lg"
                />

                <input
                  type="number"
                  value={daysLast}
                  onChange={(e) => setDaysLast(e.target.value)}
                  placeholder="Days it lasts"
                  className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-3 rounded-lg"
                />

                <input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Vendor"
                  className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-3 rounded-lg"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="w-1/2 p-3 border rounded-lg"
                  >
                    Cancel
                  </button>

                  <button type="submit" className="w-1/2 bg-sky-600 text-white p-3 rounded-lg">
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {showEdit && editItem && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl p-6 shadow"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold">Edit Item</h2>

              <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                <input
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-3 rounded-lg"
                />

                <input
                  type="number"
                  value={editItem.daysLast}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      daysLast: Number(e.target.value),
                    })
                  }
                  className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-3 rounded-lg"
                />

                <input
                  value={editItem.vendor}
                  onChange={(e) => setEditItem({ ...editItem, vendor: e.target.value })}
                  className="w-full border dark:border-slate-600 bg-white dark:bg-slate-900 p-3 rounded-lg"
                />

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowEdit(false)} className="w-1/2 p-3 border rounded-lg">
                    Cancel
                  </button>

                  <button type="submit" className="w-1/2 bg-blue-600 text-white p-3 rounded-lg">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {showDelete && deleteItemId && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-xl p-6 shadow text-center"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold">Delete Item?</h2>
              <p className="text-slate-600 dark:text-slate-300 mt-2">This action cannot be undone.</p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDelete(false);
                    setDeleteItemId(null);
                  }}
                  className="w-1/2 p-3 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    handleDeleteItem(deleteItemId);
                    setShowDelete(false);
                    setDeleteItemId(null);
                  }}
                  className="w-1/2 bg-red-600 text-white p-3 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}