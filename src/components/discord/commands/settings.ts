import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import SettingController from '../../../controller/SettingController.js';
import settingsEmbed from '../../../helpers/embeds/settingsEmbed.js';
import SettingsEnum from '../../../helpers/enums/SettingsEnum.js';
import DiscordCommandInterface from '../../../interfaces/DiscordCommandInterface.js';

const productCommand: DiscordCommandInterface = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Settings related to tracking bot')
    .addSubcommand(subCommand => subCommand.setName('info')
      .setDescription('Shows the current settings to the user'))
    .addSubcommand(subCommand => subCommand.setName('set')
      .setDescription('Sets the selected setting')
      .addStringOption(option => option.setName('setting')
        .setDescription('The setting to change')
        .setRequired(true)
        .addChoices(
          { name: 'Takip Aralığı', value: SettingsEnum.trackingInterval },
          { name: 'En az fiyat düşüşü', value: SettingsEnum.minimumPriceDrop },
          { name: 'En az fiyat düşüşü (yÜzde)', value: SettingsEnum.minimumPriceDropPercentage },
          { name: 'Yalnızca en düşük fiyat bildirimi', value: SettingsEnum.onlyNotifyLowestPriceDrops }
        ))
      .addStringOption(option => option.setName('value')
        .setDescription('The value to set')
        .setRequired(true))),
  execute: async (interaction: CommandInteraction) => {
    const subCommand = interaction.options.getSubcommand();
    try {
      const settings = await SettingController.getAll();
      if (subCommand === 'info') {
        await interaction.reply({
          embeds: [settingsEmbed(settings)],
          ephemeral: true
        });

        return;
      }

      const userSetting = interaction.options.getString('setting', true) as SettingsEnum;
      const setting = settings.get(userSetting);
      if (!setting) {
        await interaction.reply({
          content: 'Belirtilen ayar bulunamadı.\nAyar: ' + userSetting,
          ephemeral: true
        });

        return;
      }

      setting.value = interaction.options.getString('value', true);
      await setting.save();
      await interaction.reply({
        embeds: [settingsEmbed(settings)],
        ephemeral: true
      });
    } catch (error) {
      console.error('An error happened while executing the settings command function.', error);

      throw new Error('SettingsCommandFailed');
    }
  }
};

export default productCommand;
