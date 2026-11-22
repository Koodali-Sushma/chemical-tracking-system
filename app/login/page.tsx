"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DEMO_USERS } from "@/lib/demoUsers";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoRole, setDemoRole] = useState("");

  const login = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: loginEmail,
        password: loginPassword,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role;

        if (role === "scientist") {
          router.push("/logs");
        } else if (role === "admin") {
          router.push("/");
        } else if (role === "lab_technician") {
          router.push("/notifications");
        } else {
          setError("Unauthorized role");
        }

        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleDemoLogin = async () => {
    const demo = DEMO_USERS.find((u) => u.role === demoRole);
    if (!demo) {
      setError("Please select a demo role");
      return;
    }
    setEmail(demo.email);
    setPassword(demo.password);
    await login(demo.email, demo.password);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-gray-600 border text-green-400 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Lab System Login
        </h1>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@lab.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-sm text-gray-300">
          <div className="h-px flex-1 bg-gray-400" />
          or try a demo account
          <div className="h-px flex-1 bg-gray-400" />
        </div>

        <div className="space-y-3">
          <label
            htmlFor="demo-role"
            className="block text-sm font-medium text-white"
          >
            Demo Login
          </label>
          <select
            id="demo-role"
            value={demoRole}
            onChange={(e) => setDemoRole(e.target.value)}
            className="w-full p-2 border rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a role…</option>
            {DEMO_USERS.map((u) => (
              <option key={u.role} value={u.role}>
                {u.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading || !demoRole}
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Logging in..." : "Demo Login"}
          </button>
        </div>
      </div>
    </main>
  );
}
