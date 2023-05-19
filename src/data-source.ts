import { DataSource } from 'typeorm';
import database from './config/database.js';
import Product from './entity/Product.js';
import ProductPriceHistory from './entity/ProductPriceHistory.js';
import Setting from './entity/Setting.js';

const sqlConnection = new DataSource({
  type: 'mysql',
  host: database.hostname,
  port: database.port,
  username: database.user,
  password: database.password,
  database: database.name,
  entities: [
    Setting,
    Product,
    ProductPriceHistory
  ],
  synchronize: true,
  logging: false
});

export default sqlConnection;
