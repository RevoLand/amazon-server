import 'dotenv/config';
import 'reflect-metadata';
import { Client } from 'discord.js';
import logUpdate from 'log-update';
import Server from './components/Server.js';
import { connectToDiscord } from './helpers/discord.js';
import { connectToSql } from './helpers/sql.js';

export let server: Server;
export let discord: Client;

const main = async () => {
  await connectToSql();

  server = new Server();

  server.initialize();

  discord = await connectToDiscord();

  setInterval(() => {
    logUpdate(`
    WebSocket Clients: ${server.socketServer.clients.size}
    ProductTracker Status: ${server.productTracker.status}
    Discord Status: ${discord.isReady()}
    Products: ${server.productTracker.products.length}
    Workers: ${server.workerPool.workers.length}
    Available Workers: ${server.workerPool.availableWorkers().length}
    `);
  }, 500);
};

main();
