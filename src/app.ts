import { Client } from 'discord.js';
import 'dotenv/config';
import 'reflect-metadata';
import Server from './components/Server';
import { connectToDiscord } from './helpers/discord';
import { connectToSql } from './helpers/sql';

export let server: Server;
export let discord: Client;

const main = async () => {
  await connectToSql();

  server = new Server();

  server.initialize();

  discord = await connectToDiscord();
};

main();
