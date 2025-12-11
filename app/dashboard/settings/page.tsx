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
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [name, setName] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [error, setError] = useState<string | null>(null);

  // AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
        setLoadingUser(false);
      }
    });
    return () => unsub();
  }, [router]);

  // LOAD USER PROFILE DOC
  useEffect(() => {
    if (!user) return;

    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data: any = snap.data() || {};

      setName(data.name || user.displayName || "");
      setEmailNotifications(
        data.emailNotifications !== undefined ? data.emailNotifications : true
      );
      setLowStockAlerts(
        data.lowStockAlerts !== undefined ? data.lowStockAlerts : true
      );
      const t: "light" | "dark" = data.theme === "dark" ? "dark" : "light";
      setTheme(t);

      if (typeof window !== "undefined") {
        document.documentElement.classList.toggle("dark", t === "dark");
        window.localStorage.setItem("sp-theme", t);
      }
    });

    return () => unsub();
  }, [user]);

  // SAVE PROFILE (NAME)
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSavingProfile(true);

    try {
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
        await updateDoc(doc(db, "users", user.uid), {
          name: name.trim(),
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  // SAVE PREFERENCES (notifications + theme)
  async function handleSavePrefs() {
    if (!user) return;
    setError(null);
    setSavingPrefs(true);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        emailNotifications,
        lowStockAlerts,
        theme,
      });

      if (typeof window !== "undefined") {
        document.documentElement.classList.toggle("dark", theme === "dark");
        window.localStorage.setItem("sp-theme", theme);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  }

  // CHANGE PASSWORD
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !currentPassword || !newPassword) return;

    setError(null);
    setPasswordMsg(null);

    try {
      const cred = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);

      setPasswordMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to change password.");
    }
  }

  // DELETE ACCOUNT
  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (deleteConfirmText !== "DELETE") {
      setError('Type "DELETE" in the confirmation box to delete your account.');
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(
        user.email!,
        deletePassword
      );
      await reauthenticateWithCredential(user, cred);

      // Delete Firestore user doc first
      await deleteDoc(doc(db, "users", user.uid));

      // Then delete auth user
      await deleteUser(user);

      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete account.");
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-500">Loading settings…</div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen flex bg-slate-100"
      initial={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Sidebar + logout come from app/dashboard/layout.tsx */}

      <main className="flex-1 p-10">
        <motion.h1
          className="text-3xl font-bold"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Settings
        </motion.h1>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {/* PROFILE SECTION */}
        <section className="mt-8 bg-white p-6 rounded-xl shadow max-w-2xl">
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="text-slate-500 text-sm mt-1">
            Update your basic account information.
          </p>

          <form
            onSubmit={handleSaveProfile}
            className="mt-4 space-y-4"
          >
            <div>
              <label className="text-sm text-slate-700">Full name</label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border p-3 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-sm text-slate-700">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border p-3 text-sm bg-slate-50"
                value={user?.email || ""}
                readOnly
              />
              <p className="text-xs text-slate-400 mt-1">
                Email changes must be done from your account owner.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:opacity-95 disabled:opacity-60"
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </form>
        </section>

        {/* PREFERENCES SECTION */}
        <section className="mt-8 bg-white p-6 rounded-xl shadow max-w-2xl">
          <h2 className="text-xl font-semibold">Preferences</h2>
          <p className="text-slate-500 text-sm mt-1">
            Notifications and appearance.
          </p>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">
                  Email notifications
                </div>
                <div className="text-xs text-slate-500">
                  Receive email alerts about supplies.
                </div>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">
                  Low stock alerts
                </div>
                <div className="text-xs text-slate-500">
                  Extra alerts when an item is about to run out.
                </div>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={lowStockAlerts}
                onChange={(e) => setLowStockAlerts(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-medium text-sm">
                  Theme
                </div>
                <div className="text-xs text-slate-500">
                  Switch between light and dark mode.
                </div>
              </div>
              <div className="inline-flex rounded-full border overflow-hidden text-xs">
                <button
                  type="button"
                  className={`px-3 py-1 ${
                    theme === "light"
                      ? "bg-sky-600 text-white"
                      : "bg-white text-slate-600"
                  }`}
                  onClick={() => setTheme("light")}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 ${
                    theme === "dark"
                      ? "bg-sky-600 text-white"
                      : "bg-white text-slate-600"
                  }`}
                  onClick={() => setTheme("dark")}
                >
                  Dark
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={savingPrefs}
              onClick={handleSavePrefs}
              className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:opacity-95 disabled:opacity-60"
            >
              {savingPrefs ? "Saving…" : "Save preferences"}
            </button>
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section className="mt-8 bg-white p-6 rounded-xl shadow max-w-2xl">
          <h2 className="text-xl font-semibold">Security</h2>
          <p className="text-slate-500 text-sm mt-1">
            Change your password or delete your account.
          </p>

          {/* Change password */}
          <form
            onSubmit={handleChangePassword}
            className="mt-4 space-y-3 border-b pb-5"
          >
            <div className="font-medium text-sm">Change password</div>

            <input
              type="password"
              className="w-full mt-1 rounded-lg border p-3 text-sm"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <input
              type="password"
              className="w-full mt-1 rounded-lg border p-3 text-sm"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:opacity-95"
            >
              Update password
            </button>

            {passwordMsg && (
              <div className="text-xs text-emerald-600 mt-1">
                {passwordMsg}
              </div>
            )}
          </form>

          {/* Delete account */}
          <form
            onSubmit={handleDeleteAccount}
            className="mt-5 space-y-3"
          >
            <div className="font-medium text-sm text-red-600">
              Delete account
            </div>
            <p className="text-xs text-slate-500">
              This will permanently delete your StockPilot account and data.
              This cannot be undone.
            </p>

            <input
              type="password"
              className="w-full mt-1 rounded-lg border p-3 text-sm"
              placeholder="Current password (for confirmation)"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />

            <input
              type="text"
              className="w-full mt-1 rounded-lg border p-3 text-sm"
              placeholder='Type "DELETE" to confirm'
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />

            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              Permanently delete account
            </button>
          </form>
        </section>
      </main>
    </motion.div>
  );
}
