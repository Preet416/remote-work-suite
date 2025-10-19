import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Auth({ onLogin, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/" },
    });

    if (error) setMessage(error.message);
    else
      setMessage(
        "✅ Signup successful! Please check your email to confirm your account."
      );
  };

  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.user.email_confirmed_at) {
      setMessage("⚠️ Email not confirmed yet. Please check your inbox.");
      return;
    }

    onLogin(); // This triggers App.jsx to mark authenticated
    onClose(); // Closes the modal
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="max-w-md w-full p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Supabase Auth</h1>

        <input
          className="w-full p-2 mb-2 border rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-2 mb-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-between">
          <button
            onClick={handleSignUp}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Sign Up
          </button>
          <button
            onClick={handleSignIn}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Sign In
          </button>
        </div>

        <button
          onClick={onClose}
          className="bg-gray-300 text-black px-4 py-2 rounded mt-4 w-full"
        >
          Close
        </button>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      </div>
    </div>
  );
}
