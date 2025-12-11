"use client";

import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-10 min-h-screen bg-slate-50">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-slate-600 mt-2">
        Welcome back, {user?.email}! Here are your usage stats.
      </p>

      <nav className="flex flex-col gap-2">
  <a href="/dashboard" className="nav-item">📊 Dashboard</a>
  <a href="/dashboard/items" className="nav-item">📦 Items</a>
  <a href="/dashboard/settings" className="nav-item">⚙️ Settings</a>
</nav>


      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <div className="p-6 bg-white rounded-xl shadow">
          <h2 className="text-xl font-semibold">Total Items</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <h2 className="text-xl font-semibold">Items Running Low</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow">
          <h2 className="text-xl font-semibold">Upcoming Reminders</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
      </div>

      {/* Graph placeholder */}
      <div className="mt-10 p-6 bg-white rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Usage Trend</h2>
        <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
          (graph goes here)
        </div>
      </div>
    </div>
  );
}
