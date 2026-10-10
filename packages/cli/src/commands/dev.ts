import { Command } from 'commander';
import { SwiteServer } from '@swissjs/swite';

interface DevOptions {
  port: string;
  host: string;
  open: boolean;
}

export const devCommand = new Command('dev')
  .description('Start SWITE development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-h, --host <host>', 'Host name', 'localhost')
  .option('--no-open', 'Do not open browser')
  .action(async (options: DevOptions) => {
    const server = new SwiteServer({
      root: process.cwd(),
      publicDir: 'public',
      port: parseInt(options.port),
      host: options.host,
      open: options.open,
    });

    await server.start();
  });
