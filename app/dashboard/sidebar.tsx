"use client";

import { motion } from "framer-motion";
import { auth } from "../../lib/firebase";
import ThemeToggle from "../../components/ThemeToggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-900">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white dark:bg-slate-800 dark:text-white border-r dark:border-slate-700 p-6 hidden md:flex flex-col">

        {/* Logo */}
        <motion.h1
          className="text-2xl font-bold mb-8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          StockPilot
        </motion.h1>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          <motion.a
            href="/dashboard"
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            📊 Dashboard
          </motion.a>

          <motion.a
            href="/dashboard/items"
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            📦 Items
          </motion.a>

          <motion.a
            href="/dashboard/settings"
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            ⚙️ Settings
          </motion.a>
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-3">

          <ThemeToggle />

          <motion.button
            onClick={() => auth.signOut()}
            whileHover={{ scale: 1.03 }}
            className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
          >
            Log Out
          </motion.button>
        </div>
      </aside>

      {/* PAGE CONTENT */}
      <main className="flex-1 p-10 dark:text-white">{children}</main>
    </div>
  );
}
