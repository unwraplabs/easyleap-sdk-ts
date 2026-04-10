import react from "@vitejs/plugin-react-swc";
import path, { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
    const isDemoMode = mode === "demo";
    console.log(`Running in ${isDemoMode ? "demo" : "production"} mode`);
    return {
        plugins: [
            tsconfigPaths(),
            react(),
            dts({
                include: ["src"],
                insertTypesEntry: true,
                copyDtsFiles: true,
                exclude: ["node_modules"],
                rollupTypes: true
            }) // export types on build
        ],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src")
            }
        },

        optimizeDeps: {
            include: ["starknet", "starkzap"]
        },

        define: {
            global: "globalThis"
        },

        // activate library mode
        build: isDemoMode
            ? {}
            : {
                  copyPublicDir: false,
                  lib: {
                      entry: resolve(__dirname, "src/main.tsx"),
                      name: "easyleap",
                      formats: ["es", "cjs"],
                      fileName: (format) => `easyleap.${format}.js`
                  },
                  sourcemap: true,
                  rollupOptions: {
                      external: [
                          "react",
                          "react-dom",
                          "@starknet-react/chains",
                          "@starknet-react/core",
                          "starknet",
                          "starknetkit",
                          "wagmi",
                          "@wagmi/core",
                          "jotai-tanstack-query"
                      ],
                      output: {
                          globals: {
                              react: "React",
                              "react-dom": "ReactDOM"
                          }
                      }
                  }
              }
    };
});
