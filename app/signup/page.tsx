"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create auth account
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Set FirebaseAuth displayName
      await updateProfile(userCred.user, {
        displayName: name,
      });

      // Save user Firestore profile
      await setDoc(doc(db, "users", userCred.user.uid), {
        name,
        email,
        createdAt: serverTimestamp(),
      });

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-3xl font-bold text-center">Create your account</h1>

        {error && (
          <div className="mt-4 bg-red-100 text-red-700 p-2 text-sm rounded">
            {error}
          </div>
        )}

        <a
          href="/"
          className="absolute top-6 left-6 text-sky-600 font-medium hover:underline"
        >
          ← Back to Home
        </a>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="you@business.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 text-white py-3 rounded-lg font-medium hover:bg-sky-700 transition disabled:bg-sky-400"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-600 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-sky-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
