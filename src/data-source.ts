import { DataSource } from 'typeorm';
import database from './config/database';
import Product from './entity/Product';
import ProductPriceHistory from './entity/ProductPriceHistory';
import Setting from './entity/Setting';

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
