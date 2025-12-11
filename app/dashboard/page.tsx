"use client";

import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });

    return () => unsub();
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen p-10 bg-slate-50">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-3xl font-bold">Welcome, {user.email}</h1>

        <p className="mt-2 text-slate-600">
          This is your StockPilot dashboard.
        </p>

        <button
          onClick={() => signOut(auth)}
          className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
