import { Repository } from 'typeorm';
import Settings from '../components/Settings.js';
import sqlConnection from '../data-source.js';
import Setting from '../entity/Setting.js';
import SettingsEnum from '../helpers/enums/SettingsEnum.js';

class SettingController {
  static repository(): Repository<Setting> {
    return sqlConnection.getRepository(Setting);
  }

  static getAll = async () => new Settings(await this.repository().find());

  static insertDefaultSettings = async () => {
    const defaultSettings = [
      {
        name: SettingsEnum.trackingInterval,
        value: '20'
      },
      {
        name: SettingsEnum.minimumPriceDrop,
        value: '10'
      },
      {
        name: SettingsEnum.minimumPriceDropPercentage,
        value: '3'
      },
      {
        name: SettingsEnum.onlyNotifyLowestPriceDrops,
        value: '1'
      },
    ];

    try {
      for (const defaultSetting of defaultSettings) {
        const setting = new Setting;
        setting.key = defaultSetting.name;
        setting.value = defaultSetting.value;
        await setting.save();
      }

      console.log('Default settings inserted to database.');
    } catch (error) {
      console.error('An error happened while inserting default settings.', error);

      throw new Error('CouldntInsertDefaultSettings');
    }
  };
}

export default SettingController;
