import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth({ onLogin, onClose }) {
  const [mode, setMode] = useState("signin"); // "signin" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // only for sign-up
  const [role, setRole] = useState("employee"); // new: employee or manager
  const [message, setMessage] = useState("");

  // Sign-up function
  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setMessage("⚠️ Please enter name, email and password");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) setMessage(error.message);
    else setMessage("✅ Signup successful! Check your email to confirm your account.");
  };

  // Sign-in function
  const handleSignIn = async () => {
    if (!email || !password) {
      setMessage("⚠️ Please enter email and password");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.user.email_confirmed_at) {
      setMessage("⚠️ Email not confirmed yet. Check your inbox.");
      return;
    }

    // get role from user metadata
    const userRole = data.user.user_metadata?.role || "employee";
    onLogin({ ...data.user, role: userRole });
    onClose();
  };

  // Reset password
  const handleReset = async () => {
    if (!email) {
      setMessage("⚠️ Enter your email to send reset link");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) setMessage(error.message);
    else setMessage("✅ Reset link sent! Check your email.");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
      <div className="w-full max-w-md p-6 bg-gray-900 text-white rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-400">
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </h1>

        {mode === "signup" && (
          <>
            <input
              className="w-full p-3 mb-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 mb-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
          </>
        )}

        <input
          className="w-full p-3 mb-3 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 mb-4 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === "signin" ? (
          <button
            onClick={handleSignIn}
            className="w-full bg-green-500 hover:bg-green-600 p-3 rounded font-semibold mb-3"
          >
            Sign In
          </button>
        ) : (
          <button
            onClick={handleSignUp}
            className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded font-semibold mb-3"
          >
            Sign Up
          </button>
        )}

        <button
          onClick={handleReset}
          className="w-full bg-yellow-500 hover:bg-yellow-600 p-3 rounded font-semibold mb-3"
        >
          Forget Password
        </button>

        <p className="text-sm text-gray-400 text-center mb-4">
          {mode === "signin" ? (
            <>
              Don’t have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-indigo-400 underline"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-indigo-400 underline"
              >
                Sign In
              </button>
            </>
          )}
        </p>

        <button
          onClick={onClose}
          className="w-full bg-gray-700 hover:bg-gray-800 p-3 rounded font-semibold"
        >
          Close
        </button>

        {message && <p className="mt-4 text-center text-sm text-gray-200">{message}</p>}
      </div>
    </div>
  );
}
