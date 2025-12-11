"use client";

import { useEffect, useState } from "react";
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
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";

export default function ItemsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  // Add item modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [daysLast, setDaysLast] = useState("");
  const [vendor, setVendor] = useState("");

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // AUTH + ITEMS
  useEffect(() => {
    let unsubItems: any = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return router.push("/login");

      setUser(currentUser);

      unsubItems = onSnapshot(
        collection(db, "users", currentUser.uid, "items"),
        (snap) =>
          setItems(
            snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }))
          )
      );
    });

    return () => {
      unsubAuth();
      if (unsubItems) unsubItems();
    };
  }, []);

  // ADD ITEM
  async function handleAddItem(e: any) {
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
    setShowModal(false);
  }

  // DELETE ITEM
  async function handleDeleteItem(itemId: string) {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "items", itemId));
  }

  async function handleEditSubmit(e: any) {
  e.preventDefault();
  if (!user || !editItem) return;

  await updateDoc(
    doc(db, "users", user.uid, "items", editItem.id),
    {
      name: editItem.name,
      daysLast: Number(editItem.daysLast),
      vendor: editItem.vendor,
    }
  );

  setShowEditModal(false);
  setEditItem(null);
}


  // REFILL
  async function handleRefillItem(id: string) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid, "items", id), {
      createdAt: serverTimestamp(),
    });
  }

  // STATUS CALC
  function getStatus(item: any) {
    if (!item.createdAt) return null;

    const created = item.createdAt.toDate();
    const now = new Date();
    const diff = Math.floor((now.getTime() - created.getTime()) / 86400000);

    const daysLeft = item.daysLast - diff;

    if (daysLeft <= 0) return { label: "Due Today", color: "red", daysLeft: 0 };
    if (daysLeft <= 3) return { label: "Running Low", color: "amber", daysLeft };
    return { label: "OK", color: "green", daysLeft };
  }

  return (
    <motion.div
      className="min-h-screen bg-slate-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >

      {/* ========================= */}
      {/* SIDEBAR – SAME AS DASHBOARD */}
      {/* ========================= */}
      <aside className="w-64 bg-white border-r p-6 hidden md:flex flex-col">
        <motion.h1
          className="text-2xl font-bold mb-8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          StockPilot
        </motion.h1>

        <nav className="flex flex-col gap-2">
          <motion.a
            href="/dashboard"
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100"
          >
            📊 Dashboard
          </motion.a>

          <motion.a
            href="/dashboard/items"
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-slate-100 font-semibold"
          >
            📦 Items
          </motion.a>

          <motion.a
            href="#"
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100"
          >
            ⚙️ Settings
          </motion.a>
        </nav>

        <motion.button
          onClick={() => signOut(auth)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-auto bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
        >
          Log Out
        </motion.button>
      </aside>

      {/* ========================= */}
      {/* MAIN CONTENT */}
      {/* ========================= */}
      <main className="flex-1 p-10">
        <motion.h1
          className="text-3xl font-bold"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Items
        </motion.h1>

        <motion.div
          className="mt-8 bg-white p-6 rounded-xl shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Items</h2>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg"
            >
              + Add Item
            </motion.button>
          </div>

          <AnimatePresence>
            {items.length === 0 ? (
              <p className="text-slate-500">No items yet! Add your first one.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const s = getStatus(item);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 border rounded-lg flex justify-between items-center bg-white hover:bg-slate-100 transition"
                    >
                      <div className="flex flex-col">
                        <h3 className="font-semibold">{item.name}</h3>

                        {s && (
                          <span
                            className={`mt-1 inline-block px-2 py-1 text-xs rounded bg-${s.color}-100 text-${s.color}-700`}
                          >
                            {s.label} • {s.daysLeft} days left
                          </span>
                        )}

                        <p className="text-slate-500 text-sm mt-2">
                          From: {item.vendor} <br />
                          Last refilled:{" "}
                          {item.createdAt
                            ? item.createdAt.toDate().toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setEditItem(item);
                            setShowEditModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                        >
                          Edit
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setDeleteItemId(item.id);
                            setShowDeleteModal(true);
                          }}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md"
                        >
                          Delete
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleRefillItem(item.id)}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md"
                        >
                          Refill
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* ========================= */}
      {/* ADD ITEM MODAL */}
      {/* ========================= */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-full max-w-md rounded-xl shadow-lg p-6"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold">Add New Item</h2>

              <form onSubmit={handleAddItem} className="mt-4 space-y-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Item name"
                  className="w-full p-3 border rounded-lg"
                />

                <input
                  type="number"
                  value={daysLast}
                  onChange={(e) => setDaysLast(e.target.value)}
                  placeholder="Days it lasts"
                  className="w-full p-3 border rounded-lg"
                />

                <input
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Vendor"
                  className="w-full p-3 border rounded-lg"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================= */}
      {/* EDIT ITEM MODAL */}
      {/* ========================= */}
      <AnimatePresence>
        {showEditModal && editItem && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-full max-w-md rounded-xl shadow-lg p-6"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold">Edit Item</h2>

              <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                <input
                  value={editItem.name}
                  onChange={(e) =>
                    setEditItem({ ...editItem, name: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg"
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
                  className="w-full p-3 border rounded-lg"
                />

                <input
                  value={editItem.vendor}
                  onChange={(e) =>
                    setEditItem({ ...editItem, vendor: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditItem(null);
                    }}
                    className="w-1/2 p-3 border rounded-lg"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="w-1/2 bg-blue-600 text-white p-3 rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================= */}
      <AnimatePresence>
        {showDeleteModal && deleteItemId && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white w-full max-w-sm rounded-xl shadow-lg p-6 text-center"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
            >
              <h2 className="text-xl font-semibold">Delete Item?</h2>
              <p className="text-slate-600 mt-2">
                This action cannot be undone.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteItemId(null);
                  }}
                  className="w-1/2 border p-3 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    handleDeleteItem(deleteItemId);
                    setShowDeleteModal(false);
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
