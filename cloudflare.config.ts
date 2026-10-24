import { bindings, defineConfig, exports } from "cf/config";
export default defineConfig({
  worker: {
    name: "math-racing",
    entrypoint: "./server/index.ts",
    compatibilityDate: "2026-10-24",
    compatibilityFlags: ["nodejs_compat"],
    exports: { RacingRoom: exports.durableObject({ storage: "sqlite" }) },
    env: {
      ROOMS: bindings.durableObject({
        worker: "math-racing",
        exportName: "RacingRoom",
      }),
      TRAFFIC: bindings.rateLimit({
        namespace: "1002",
        simple: { limit: 60, period: 60 },
      }),
    },
    assets: {
      notFoundHandling: "single-page-application",
      runWorkerFirst: ["/api/*"],
    },
    observability: { enabled: true, traces: { enabled: true } },
  },
});
