/**
 * tailwind.config.ts — Legacy (Tailwind v3 format).
 *
 * NOTE: This project uses Tailwind CSS v4 with @tailwindcss/postcss.
 * All theme customizations are defined in src/styles/globals.css via @theme.
 * This file is kept only for backwards-compatible tooling that may reference it.
 * The authoritative color definitions live in globals.css @theme block.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
