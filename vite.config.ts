import { networkInterfaces } from "node:os";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
export default defineConfig(({ command }) => {
  const interfaces = networkInterfaces();
  const addresses = [
    ...(interfaces.en0 ?? []),
    ...Object.values(interfaces).flatMap((value) => value ?? []),
  ];
  const lan =
    addresses.find(
      (address) =>
        address.family === "IPv4" &&
        !address.internal &&
        /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address),
    )?.address ?? "";
  return {
    define: {
      "import.meta.env.VITE_DEV_LAN_HOST": JSON.stringify(
        command === "serve" ? lan : "",
      ),
    },
    plugins: [
      react(),
      cloudflare({ persistState: { path: ".cloudflare/state/dev" } }),
    ],
  };
});
