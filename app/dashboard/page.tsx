"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    runningLow: 0,
    dueToday: 0,
  });

  // Check auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsub();
  }, []);

  // Fetch items
  useEffect(() => {
    if (!user) return;

    const unsubItems = onSnapshot(
      collection(db, "users", user.uid, "items"),
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setItems(data);
        calculateStats(data);
      }
    );

    return () => unsubItems();
  }, [user]);

  // Compute stats
  function calculateStats(items: any[]) {
    const today = new Date();
    let runningLow = 0;
    let dueToday = 0;

    items.forEach((item) => {
      if (!item.createdAt) return;

      const created = item.createdAt.toDate();
      const emptyDate = new Date(created);
      emptyDate.setDate(emptyDate.getDate() + item.daysLast);

      const diffDays = Math.ceil(
        (emptyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 3) runningLow++;
      if (diffDays === 0) dueToday++;
    });

    setStats({
      totalItems: items.length,
      runningLow,
      dueToday,
    });
  }

  return (
    <div className="min-h-screen flex bg-slate-100">

      {/* =============================== */}
      {/* SIDEBAR NAVIGATION */}
      {/* =============================== */}
      <aside className="w-64 bg-white border-r p-6 hidden md:flex flex-col">
        <h1 className="text-2xl font-bold mb-8">StockPilot</h1>

        <nav className="flex flex-col gap-2">
          <a href="/dashboard" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100">
            📊 Dashboard
          </a>

          <a href="/dashboard/items" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100">
            📦 Items
          </a>

          <a href="/dashboard/settings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100">
            ⚙️ Settings
          </a>
        </nav>

        <button
          onClick={() => auth.signOut()}
          className="mt-auto bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
        >
          Log Out
        </button>
      </aside>

      {/* =============================== */}
      {/* MAIN CONTENT */}
      {/* =============================== */}
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Welcome back, {user?.email}! Here's your supply overview:
        </p>

        {/* =============================== */}
        {/* STATS CARDS */}
        {/* =============================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">

          <div className="p-6 bg-white rounded-xl shadow">
            <h2 className="text-lg text-slate-600">Total Items</h2>
            <p className="text-4xl font-bold mt-2">{stats.totalItems}</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow">
            <h2 className="text-lg text-slate-600">Running Low (≤ 3 days)</h2>
            <p className="text-4xl font-bold mt-2 text-amber-600">
              {stats.runningLow}
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow">
            <h2 className="text-lg text-slate-600">Due Today</h2>
            <p className="text-4xl font-bold mt-2 text-red-600">
              {stats.dueToday}
            </p>
          </div>
        </div>

        {/* =============================== */}
        {/* USAGE GRAPH PLACEHOLDER */}
        {/* =============================== */}
        <div className="mt-10 bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Usage Trend (Coming Soon)</h2>

          <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
            Graph will go here
          </div>
        </div>
      </main>
    </div>
  );
}
