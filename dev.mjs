import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const isWindows = process.platform === 'win32';
const command = isWindows ? (process.env.ComSpec || 'cmd.exe') : 'npm';
const args = isWindows ? ['/d', '/s', '/c', 'npm run dev'] : ['run', 'dev'];

const targets = [
  { name: 'server', cwd: path.join(rootDir, 'server') },
  { name: 'client', cwd: path.join(rootDir, 'client') },
];

const children = targets.map(({ name, cwd }) => {
  console.log(`[${name}] starting in ${cwd}`);

  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
    windowsVerbatimArguments: false,
  });

  child.on('error', (error) => {
    console.error(`[${name}] Failed to start:`, error);
  });

  child.on('exit', (code, signal) => {
    if (signal) console.log(`[${name}] stopped (${signal})`);
    else console.log(`[${name}] stopped with code ${code}`);
  });

  return child;
});

const shutdown = (signal) => {
  for (const child of children) {
    try {
      child.kill(signal);
    } catch {
      // Child may already be stopped.
    }
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('exit', () => shutdown());
