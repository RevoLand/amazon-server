import { LessThanOrEqual, Repository } from 'typeorm';
import sqlConnection from '../data-source.js';
import Product from '../entity/Product.js';
import ProductParseResultInterface from '../interfaces/ProductParseResultInterface.js';
import discordConfig from '../config/discord.js';
import { discord } from '../app.js';

class ProductController {

  static repository(): Repository<Product> {
    return sqlConnection.getRepository(Product);
  }

  static all(): Promise<Product[] | undefined> {
    return this.repository().find();
  }

  static enabled(): Promise<Product[] | undefined> {
    return this.repository().find({
      where: {
        enabled: true
      }
    });
  }

  static enabledWithDateFilter(lastUpdate: Date): Promise<Product[] | null> {
    return this.repository().find({
      where: {
        enabled: true,
        updatedAt: LessThanOrEqual(lastUpdate)
      }
    });
  }

  static byAsin(asin: string): Promise<Product[] | undefined> {
    return this.repository().find({
      where: {
        asin
      },
    });
  }

  static byAsinAndLocale(asin: string, locale: string): Promise<Product | null> {
    return this.repository().findOne({
      where: {
        asin: asin,
        country: locale
      },
    });
  }

  static upsertProduct = async (productParseResult: ProductParseResultInterface): Promise<Product> => {
    const product = productParseResult.product ?? new Product;

    if (product.asin && product.asin !== productParseResult.parsedData.asin && discordConfig.notifyChannelId) {
      const notifyChannel = discord.channels.cache.get(discordConfig.notifyChannelId);

      if (notifyChannel?.isText()) {
        notifyChannel.send({
          content: `Ürün ASIN kodu değişmiş!\n\n${product.getUrl()}\nÜrün ID: ${product.id}\nEski ASIN: ${product.asin}\nYeni ASIN: ${productParseResult.parsedData.asin}`
        });
      }
    } else {
      product.asin = productParseResult.parsedData.asin;
    }

    product.name = productParseResult.parsedData.title;
    product.country = productParseResult.parsedData.locale;
    product.image = productParseResult.parsedData.image;

    if (typeof productParseResult.psc !== 'undefined') {
      product.psc = productParseResult.psc;
    }

    if (typeof productParseResult.sellerId !== 'undefined') {
      product.sellerId = productParseResult.sellerId;
    }

    if (typeof product.lowestPrice === 'undefined' || (typeof productParseResult.parsedData.price !== 'undefined' && productParseResult.parsedData.price < product.lowestPrice)) {
      product.lowestPrice = productParseResult.parsedData.price;
    }

    if (typeof product.price === 'undefined') {
      product.price = productParseResult.parsedData.price;
    }

    product.seller = productParseResult.parsedData.seller;
    product.currentPrice = productParseResult.parsedData.price;

    try {
      await product.save();
    } catch (error) {
      console.error(error);
    }

    return product;
  };

  static disableProductTracking = async (productDetail: Product) => {
    productDetail.enabled = false;

    await productDetail.save();

    // TODO: Discord related actions?

    return productDetail;
  };
}

export default ProductController;
