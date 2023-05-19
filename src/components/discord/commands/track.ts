import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { trackProducts } from '../../../helpers/discord.js';
import { parseProductUrls } from '../../../helpers/productUrlHelper.js';
import DiscordCommandInterface from '../../../interfaces/DiscordCommandInterface.js';

const trackCommand: DiscordCommandInterface = {
  data: new SlashCommandBuilder()
    .setName('track')
    .setDescription('Parses the product url\'s from text and lists to the user.')
    .addStringOption(option => option.setName('products').setDescription('Message to parse product urls from').setRequired(true)),
  execute: async (interaction: CommandInteraction) => {
    const productUrls = parseProductUrls(interaction.options.getString('products', true));

    await trackProducts(productUrls, interaction);
  }
};

export default trackCommand;
