import { Client } from 'discord.js';

const discordReadyEvent = (client: Client) => {
  console.log('Discord is ready!');
};

export default discordReadyEvent;
