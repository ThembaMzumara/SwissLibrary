/*
 * HMR Engine for SWITE
 */

import chokidar from 'chokidar';
import { WebSocketServer, WebSocket } from 'ws';
import chalk from 'chalk';

export class HMREngine {
    private wss: WebSocketServer;
    private watcher?: chokidar.FSWatcher;
    private clients = new Set<WebSocket>();

    constructor(private root: string) {
        this.wss = new WebSocketServer({ port: 24678 });

        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log(chalk.green('[HMR] Client connected'));

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(chalk.gray('[HMR] Client disconnected'));
            });
        });
    }

    async start() {
        this.watcher = chokidar.watch(this.root, {
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
            ],
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 100,
            },
        });

        this.watcher.on('change', (filePath) => {
            console.log(chalk.yellow(`[HMR] ${filePath} changed`));

            this.broadcast({
                type: 'update',
                path: filePath,
                timestamp: Date.now(),
            });
        });

        console.log(chalk.green('[HMR] Watching for file changes...'));
    }

    getClientScript(): string {
        return `
// SWITE HMR Client
console.log('[SWITE] HMR enabled');

const socket = new WebSocket('ws://localhost:24678');

socket.addEventListener('open', () => {
  console.log('[SWITE] HMR connected');
});

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'update') {
    console.log('[SWITE] Reloading:', data.path);
    
    // For now, do full page reload
    // TODO: Implement smart HMR with module graph
    window.location.reload();
  }
});

socket.addEventListener('close', () => {
  console.log('[SWITE] HMR disconnected');
});

socket.addEventListener('error', (error) => {
  console.error('[SWITE] HMR error:', error);
});
`;
    }

    private broadcast(message: { type: string; path: string; timestamp: number }) {
        const payload = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    }

    async stop() {
        await this.watcher?.close();
        this.wss.close();
    }
}
