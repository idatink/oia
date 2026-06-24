#!/usr/bin/env npx tsx
import { TopoRouter } from './router/topo.js';

const router = new TopoRouter();

function echoHelp() {
  console.log(`
Commands:
  surfaces  - list supported surfaces
  help      - show this help
  exit      - quit
`);
}

if (process.stdin.isTTY) {
  const readline = await import('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'nia> ' });
  rl.prompt();
  rl.on('line', (line) => {
    const [cmd] = line.trim().split(/\s+/);
    if (!cmd || cmd === 'help') {
      echoHelp();
    } else if (cmd === 'surfaces') {
      console.log(router.surfaceNames());
    } else if (cmd === 'exit') {
      rl.close();
      process.exit(0);
    } else {
      console.log(`Unknown command: ${cmd}`);
    }
    rl.prompt();
  });
}
