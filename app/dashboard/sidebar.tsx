"use client";

import { motion } from "framer-motion";
import { auth } from "../../lib/firebase";
import ThemeToggle from "../../components/ThemeToggle"; // optional if you're adding dark mode toggle

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 p-6 hidden md:flex flex-col">
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

      

      <ThemeToggle />

<motion.button
  onClick={() => auth.signOut()}
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  className="mt-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
>
  Log Out
</motion.button>

    </aside>
  );
}
