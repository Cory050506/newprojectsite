"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import {
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { doc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Preferences (theme removed)
  const [name, setName] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  // Account deletion
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [error, setError] = useState<string | null>(null);

  // AUTH CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
      setLoadingUser(false);
    });
    return () => unsub();
  }, [router]);

  // LOAD USER PROFILE (theme removed)
  useEffect(() => {
    if (!user) return;

    const ref = doc(db, "users", user.uid);

    const unsub = onSnapshot(ref, (snap) => {
      const data: any = snap.data() || {};

      setName(data.name || user.displayName || "");
      setEmailNotifications(data.emailNotifications ?? true);
      setLowStockAlerts(data.lowStockAlerts ?? true);
    });

    return () => unsub();
  }, [user]);

  // SAVE PROFILE
  async function handleSaveProfile(e: any) {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    setError(null);

    try {
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
        await updateDoc(doc(db, "users", user.uid), { name: name.trim() });
      }
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
    }

    setSavingProfile(false);
  }

  // SAVE PREFS (theme removed)
  async function handleSavePrefs() {
    if (!user) return;

    setSavingPrefs(true);
    setError(null);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        emailNotifications,
        lowStockAlerts,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save preferences.");
    }

    setSavingPrefs(false);
  }

  // CHANGE PASSWORD
  async function handleChangePassword(e: any) {
    e.preventDefault();
    if (!user) return;

    setPasswordMsg(null);
    setError(null);

    try {
      const cred = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);

      setPasswordMsg("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    }
  }

  // DELETE ACCOUNT
  async function handleDeleteAccount(e: any) {
    e.preventDefault();
    if (!user) return;

    if (deleteConfirmText !== "DELETE") {
      setError('You must type "DELETE" to confirm.');
      return;
    }

    setError(null);

    try {
      const cred = EmailAuthProvider.credential(user.email!, deletePassword);
      await reauthenticateWithCredential(user, cred);

      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to delete account.");
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading settings…
      </div>
    );
  }

  return (
    <motion.main
      className="flex-1 p-10 text-slate-800 dark:text-slate-100"
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className="text-3xl font-bold">Settings</h1>

      {error && (
        <div className="mt-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded">
          {error}
        </div>
      )}

      {/* PROFILE */}
      <section className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700 max-w-2xl">
        <h2 className="text-xl font-semibold">Profile</h2>

        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          <div>
            <label className="text-sm">Full Name</label>
            <input
              type="text"
              className="mt-1 w-full p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Email</label>
            <input
              type="email"
              readOnly
              className="mt-1 w-full p-3 rounded-lg border bg-slate-100 dark:bg-slate-700 dark:border-slate-600"
              value={user.email}
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </section>

      {/* PREFERENCES (no theme setting anymore) */}
      <section className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700 max-w-2xl">
        <h2 className="text-xl font-semibold">Preferences</h2>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Email Notifications</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Receive email alerts for low or due items.
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Low Stock Alerts</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Show warnings when items are nearly empty.
              </div>
            </div>
            <input
              type="checkbox"
              checked={lowStockAlerts}
              onChange={(e) => setLowStockAlerts(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          <button
            type="button"
            disabled={savingPrefs}
            onClick={handleSavePrefs}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-60"
          >
            {savingPrefs ? "Saving…" : "Save Preferences"}
          </button>
        </div>
      </section>

      {/* SECURITY */}
      <section className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700 max-w-2xl">
        <h2 className="text-xl font-semibold">Security</h2>

        {/* PASSWORD */}
        <form onSubmit={handleChangePassword} className="mt-4 space-y-3 pb-5 border-b dark:border-slate-700">
          <div className="font-medium text-sm">Change Password</div>

          <input
            type="password"
            placeholder="Current password"
            className="w-full p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="New password"
            className="w-full p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">
            Update Password
          </button>

          {passwordMsg && (
            <p className="text-xs text-emerald-500 mt-1">{passwordMsg}</p>
          )}
        </form>

        {/* DELETE ACCOUNT */}
        <form onSubmit={handleDeleteAccount} className="mt-5 space-y-3">
          <div className="font-medium text-sm text-red-600">Delete Account</div>

          <input
            type="password"
            placeholder="Password for verification"
            className="w-full p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />

          <input
            type="text"
            placeholder='Type "DELETE" to confirm'
            className="w-full p-3 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />

          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Permanently Delete Account
          </button>
        </form>
      </section>
    </motion.main>
  );
}
