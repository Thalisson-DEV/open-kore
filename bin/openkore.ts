#!/usr/bin/env bun
import { spawn } from "bun";
import { join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { homedir } from "os";

const projectRoot = join(import.meta.dir, "..");
const logDir = join(homedir(), ".openkore", "logs");

if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

const serverLogFile = join(logDir, "server.log");
const serverLog = existsSync(serverLogFile) ? serverLogFile : join(logDir, `server-${Date.now()}.log`);

// Limpar log anterior
writeFileSync(serverLog, "");

// Iniciar o servidor em background redirecionando logs
const server = spawn(["bun", "run", "src/index.ts"], {
  cwd: join(projectRoot, "packages/server"),
  stdout: Bun.file(serverLog),
  stderr: Bun.file(serverLog),
  env: { ...process.env, OPENKORE_PROJECT_ROOT: process.cwd() }
});

// Aguardar o servidor subir
let attempts = 0;
while (attempts < 5) {
  try {
    const res = await fetch("http://localhost:8080/health");
    if (res.ok) break;
  } catch (e) {}
  await new Promise(r => setTimeout(r, 500));
  attempts++;
}

// Iniciar a TUI DIRETAMENTE para possuir o TTY
const tui = spawn(["bun", "run", "src/index.tsx"], {
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

// Se a TUI fechar, fecha o servidor também
(async () => {
  await tui.exited;
  server.kill();
  process.exit();
})();
