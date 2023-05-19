import { AfterUpdate, BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import SettingsEnum from '../helpers/enums/SettingsEnum.js';

@Entity('settings')
class Setting extends BaseEntity {
    @PrimaryGeneratedColumn()
      id: number;

    @Column({
      type: 'varchar',
      unique: true
    })
      key: SettingsEnum;

    @Column()
      value: string;

    @AfterUpdate()
    async updateProductTracker() {
      if (this.key !== SettingsEnum.trackingInterval) {
        return;
      }

      // TODO: trackingInterval değiştiğinde herhangi bir işlem yapılmalı mı?
      // productTrackers.forEach((productTracker) => productTracker.restart());
    }
}

export default Setting;
