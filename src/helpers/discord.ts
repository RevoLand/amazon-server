import { CacheType, Client, CommandInteraction, Intents, Message } from 'discord.js';
import { server } from '../app.js';
import { readDiscordCommands, registerDiscordCommands } from '../components/discord/discordCommands.js';
import discordReadyEvent from '../components/discord/events/discordReadyEvent.js';
import discordConfig from '../config/discord.js';
import ProductController from '../controller/ProductController.js';
import ProductUrlInterface from '../interfaces/ProductUrlInterface.js';
import { getRandomInt } from './common.js';
import productTrackingStoppedEmbed from './embeds/productTrackingStoppedEmbed.js';
import { parseProductUrls, parseProductUrlsWithTlds } from './productUrlHelper.js';

export const trackProducts = async (productUrls: string[], interaction: CommandInteraction<CacheType> | Message<boolean>) => {
  if (productUrls.length === 0) {
    await interaction.reply({
      content: 'Girilen mesaj takibe uygun ürün içermiyor 😢',
      ephemeral: true
    });

    return;
  }

  try {
    await interaction.reply({
      content: `Aşağıdaki ürün(ler) takibe alınacak:\`\`\`${productUrls.join('\n')}\`\`\``,
      ephemeral: true
    });

    const availableWorkers = server.workerPool.availableWorkers();

    if (availableWorkers.length === 0) {
      await interaction.reply({
        content: 'Uygun durumda bir Worker bulunmadığı için ürün(ler) takibe alınamadı. Toplam worker sayısı: ' + server.workerPool.workers.length,
        ephemeral: true
      });

      return;
    }

    for (const productUrl of productUrls) {
      availableWorkers[getRandomInt(0, availableWorkers.length - 1)].createProductTracking(productUrl, interaction.channelId);
    }
  } catch (error) {
    console.error('An error happened while executing the track command function.', error);

    throw new Error('TrackCommandFailed');
  }
};

export const stopTrackingProducts = async (products: ProductUrlInterface[], interaction: CommandInteraction<CacheType> | Message<boolean>) => {
  if (products.length === 0) {
    await interaction.reply({
      content: 'Girilen mesaj takibe uygun ürün içermiyor 😢',
      ephemeral: true
    });

    return;
  }

  await interaction.reply({
    content: 'Ürün bulundu, takipten çıkartılıyor...',
    ephemeral: true
  });

  try {
    for (const parsedProductInfo of products) {
      const product = await ProductController.byAsinAndLocale(parsedProductInfo.asin, parsedProductInfo.locale);
      if (!product) {
        // TODO: /product komutundan gelen url'lerde, ürün yoksa takip için eklenmeli mi?
        continue;
      }

      await ProductController.disableProductTracking(product);

      // TODO
      // productTrackers.find(productTracker => productTracker.country === product.country)?.queue.removeProductFromQueue(product);

      await interaction.channel?.send({
        embeds: [productTrackingStoppedEmbed(product)]
      });
    }
  } catch (error) {
    console.error('An error happened while executing the stop command function.', error);

    throw new Error('StopCommandFailed');
  }
};

export const connectToDiscord = async (): Promise<Client> => {
  if (!discordConfig.botToken) {
    console.error('Discord bot token is not set.');

    throw new Error('DiscordBotTokenNotSet');
  }

  console.log('Preparing Discord connection.');

  const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
  const commands = await readDiscordCommands();

  // Register commands
  await registerDiscordCommands(commands.map(command => command.data.toJSON()));

  try {
    client.once('ready', () => discordReadyEvent(client));

    client.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) {
        return;
      }

      const command = commands.get(interaction.commandName);
      if (!command) {
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        return interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    });

    client.on('messageCreate', async message => {
      if (message.author.bot || message.content.indexOf('!') !== 0) {
        return;
      }

      const args = message.content.slice(1).trim().split(/ +/g);
      const command = args.shift()?.toLowerCase();

      if (!command) {
        return;
      }

      switch (command) {
        case 'track':
        case 'takip':
        case 't':
          await trackProducts(parseProductUrls(message.content), message);
          return;
        case 'stop':
        case 'takipsil':
        case 'sil':
          await stopTrackingProducts(parseProductUrlsWithTlds(message.content), message);
          return;
      }
    });

    await client.login(discordConfig.botToken);
  } catch (error) {
    console.error('An error happened while connecting to Discord.', error);

    throw new Error('DiscordConnectionFailed');
  }

  return client;
};
