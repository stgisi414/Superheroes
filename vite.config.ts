import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(
        env.GEMINI_API_KEY || process.env.GEMINI_API_KEY,
      ),
      "process.env.FAL_KEY": JSON.stringify(
        env.FAL_KEY || process.env.FAL_KEY,
      ),
      "process.env.FIREBASE_API_KEY": JSON.stringify(
        env.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
      ),
      "process.env.FIREBASE_AUTH_DOMAIN": JSON.stringify(
        env.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      ),
      "process.env.FIREBASE_PROJECT_ID": JSON.stringify(
        env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      ),
      "process.env.FIREBASE_STORAGE_BUCKET": JSON.stringify(
        env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      ),
      "process.env.FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(
        env.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      ),
      "process.env.FIREBASE_APP_ID": JSON.stringify(
        env.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
      )
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      host: true,
      port: 5173,
      allowedHosts: [
        "dc6fd3fc-1ae9-41e5-b6a6-cdd53582d9eb-00-1akqpj7omovi5.riker.replit.dev",
        "superheroesare.cool",
        "superheroez.replit.app",
        "www.superheroesare.cool"
      ],
    },
    preview: {
      host: "0.0.0.0",
      port: 5173,
    },
  };
});
