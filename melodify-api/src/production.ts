import { spawn, type ChildProcess } from "node:child_process";

type ProcessConfig = {
  name: string;
  file: string;
};

const processes: ProcessConfig[] = [
  {
    name: "api",
    file: "dist/server.js",
  },
  {
    name: "listening-worker",
    file: "dist/workers/listening.worker.js",
  },
  {
    name: "audio-worker",
    file: "dist/workers/audio-processing.worker.js",
  },
];

const children: ChildProcess[] = [];

const startProcess = ({ name, file }: ProcessConfig): void => {
  console.log(`[production] Starting ${name}: node ${file}`);

  const child = spawn("node", [file], {
    stdio: "inherit",
    env: process.env,
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    console.error(
      `[production] ${name} exited. code=${code ?? "null"} signal=${signal ?? "null"}`,
    );

    // One critical process died, terminate complete service.
    // Render will restart the container.
    shutdown(1);
  });

  child.on("error", (error) => {
    console.error(`[production] Failed to start ${name}`, error);
    shutdown(1);
  });
};

let shuttingDown = false;

const shutdown = (exitCode = 0): void => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log("[production] Shutting down...");

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 3000).unref();
};

for (const processConfig of processes) {
  startProcess(processConfig);
}

process.on("SIGTERM", () => {
  shutdown(0);
});

process.on("SIGINT", () => {
  shutdown(0);
});
