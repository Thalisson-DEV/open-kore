#!/usr/bin/env bun
import { spawn } from "bun";
import { join } from "path";

const projectRoot = join(import.meta.dir, "..");

console.log("🚀 Iniciando OpenKore...");

// Iniciar o servidor em background
const server = spawn(["bun", "run", "dev"], {
  cwd: join(projectRoot, "packages/server"),
  stdout: "inherit",
  stderr: "inherit",
});

// Aguardar um pouco para o servidor subir (simplificado por enquanto)
await new Promise(resolve => setTimeout(resolve, 1000));

// Iniciar a TUI
const tui = spawn(["bun", "run", "dev"], {
  cwd: join(projectRoot, "packages/tui"),
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

// Monitorar processos
process.on("SIGINT", () => {
  server.kill();
  tui.kill();
  process.exit();
});
