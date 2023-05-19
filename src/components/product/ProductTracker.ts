import dayjs from 'dayjs';
import _ from 'lodash';
import { exit } from 'process';
import { discord, server } from '../../app.js';
import discordConfig from '../../config/discord.js';
import ProductController from '../../controller/ProductController.js';
import SettingController from '../../controller/SettingController.js';
import Product from '../../entity/Product.js';
import ProductPriceHistory from '../../entity/ProductPriceHistory.js';
import { wait } from '../../helpers/common.js';
import productPriceChangeEmbed from '../../helpers/embeds/productPriceChangeEmbed.js';
import productPriceDropEmbed from '../../helpers/embeds/productPriceDropEmbed.js';
import SettingsEnum from '../../helpers/enums/SettingsEnum.js';
import WorkerStateEnum from '../../helpers/enums/WorkerStateEnum.js';
import PriceChangeInterface from '../../interfaces/PriceChangeInterface.js';
import ProductParseResultInterface from '../../interfaces/ProductParseResultInterface.js';
import ProductTrackerProductInterface from '../../interfaces/ProductTrackerProductInterface.js';
import TrackingResponseInterface from '../../interfaces/TrackingResponseInterface.js';
import Settings from '../Settings.js';
import Worker from '../worker/Worker.js';

class ProductTracker {
  products: ProductTrackerProductInterface[] = [];

  status: boolean;

  trackingIntervalMinutes: number;

  interval?: NodeJS.Timer;

  settings: Settings;

  trackProduct = (product: Product) => {
    const existingProductWithTimeout = this.products.find((productTrackerProduct: ProductTrackerProductInterface) => productTrackerProduct.product.id === product.id && productTrackerProduct.addedToListAt.add(20, 'minutes').isBefore(dayjs()));

    if (existingProductWithTimeout) {
      // TODO: bu üründe worker varsa worker'daki işlemi iptal et

      // ardından ürünü listeden kaldır
      this.products = this.products.filter((productTrackerProduct: ProductTrackerProductInterface) => productTrackerProduct.product.id !== existingProductWithTimeout.product.id);
    }

    const productTrackerProductToTrack: ProductTrackerProductInterface = {
      product,
      addedToListAt: dayjs(),
    };

    this.products.push(productTrackerProductToTrack);
  };

  private queueProductsForTracking = async () => {
    try {
      let productsForTracking = await ProductController.enabledWithDateFilter(dayjs().subtract(this.trackingIntervalMinutes, 'm').toDate());

      if (!productsForTracking || productsForTracking.length === 0) {
        return;
      }

      productsForTracking = productsForTracking.filter(product => this.products.findIndex((productTrackerProduct: ProductTrackerProductInterface) => productTrackerProduct.product.id === product.id) === -1);

      if (productsForTracking.length === 0) {
        return;
      }

      const shuffledProductsList = _.shuffle(productsForTracking);

      for (const product of shuffledProductsList) {
        this.trackProduct(product);
      }
    } catch (error) {
      console.error('Hata - queueProductsForTracking', error);
    }

    if (discordConfig.botSpamChannelId && this.products.length > 0) {
      const botSpamChannel = discord.channels.cache.get(discordConfig.botSpamChannelId);
      if (botSpamChannel?.isText()) {
        botSpamChannel.send({
          content: `Has ${this.products.length} products queued for tracking.`
        });
      }
    }
  };

  start = async () => {
    if (this.status) {
      return;
    }

    this.status = true;

    const settings = await SettingController.getAll();

    if (!settings.count()) {
      await SettingController.insertDefaultSettings();
    }

    this.settings = settings;

    const trackingInterval = this.settings.get(SettingsEnum.trackingInterval);

    if (!trackingInterval) {
      console.error('Tracking interval not found');

      exit();
    }

    this.trackingIntervalMinutes = +trackingInterval.value;

    while (!discord || !discord.isReady()) {
      await wait(1000);
    }

    clearInterval(this.interval);

    this.interval = setInterval(this.queueProductsForTracking, this.trackingIntervalMinutes / 4 * 60 * 1000);

    await this.queueProductsForTracking();

    this.tracker();
  };

  tracker = async () => {
    const productsWithoutWorker = this.products.filter((productTrackerProduct: ProductTrackerProductInterface) => !productTrackerProduct.worker);

    if (productsWithoutWorker.length > 0) {
      server.workerPool.availableWorkers().forEach((worker, workerIndex) => {
        if (productsWithoutWorker.length < workerIndex) {
          return;
        }

        worker.updateState(WorkerStateEnum.busy);

        worker.beginProductTracking(productsWithoutWorker[workerIndex]);
      });
    }

    await wait(2000);
    this.tracker();
  };

  beginTrackingHandshake = (productId: number, worker: Worker) => {
    const productTrackerProduct = this.products.find((product: ProductTrackerProductInterface) => product.product.id === productId);

    if (!productTrackerProduct) {
      console.log('beginTrackingHandshake\'a gelen ürün id\'si kuyrukta bulunamadı?', productId);
      return;
    }

    productTrackerProduct.worker = worker;
  };

  handleTrackingResponse = async (trackingResponse: TrackingResponseInterface, worker: Worker) => {
    worker.updateState(WorkerStateEnum.idle);

    const productTrackerProduct = this.products.find((product: ProductTrackerProductInterface) => product.product.id === trackingResponse.productId);

    if (!productTrackerProduct) {
      console.log('handleTrackingResponse\'a gelen ürün id\'si kuyrukta bulunamadı?', trackingResponse);

      return;
    }

    const product = productTrackerProduct.product;
    const parsedProductData = trackingResponse.parserResult;

    product.reload();

    // If price is changed
    if (parsedProductData.price && product.currentPrice != parsedProductData.price) {
      let discordNotification = true;
      const priceHistory = new ProductPriceHistory;
      priceHistory.oldPrice = product.currentPrice || 0;
      priceHistory.newPrice = parsedProductData.price;
      priceHistory.product = product;
      priceHistory.primeOnly = !!parsedProductData.primeOnly;
      await priceHistory.save();

      const priceChange: PriceChangeInterface = {
        product,
        parsedProductData,
        priceHistory,
        priceDiff: +(priceHistory.oldPrice - priceHistory.newPrice).toFixed(2),
        lowestPriceDiff: +((product.lowestPrice ?? 0) - priceHistory.newPrice).toFixed(2),
        priceDiffPerc: +(100 - (priceHistory.newPrice / priceHistory.oldPrice * 100)).toFixed(2),
        lowestPriceDiffPerc: +(100 - (priceHistory.newPrice / (product.lowestPrice ?? 0) * 100)).toFixed(2)
      };

      if (discordConfig.botSpamChannelId) {
        const botSpamChannel = discord.channels.cache.get(discordConfig.botSpamChannelId);
        if (botSpamChannel?.isText()) {
          botSpamChannel.send({
            embeds: [productPriceChangeEmbed(priceChange)]
          });
        }
      }

      const minimumPriceDrop = this.settings.get(SettingsEnum.minimumPriceDrop);
      const minimumPriceDropPerc = this.settings.get(SettingsEnum.minimumPriceDropPercentage);
      const onlyShowLowestPrices = this.settings.get(SettingsEnum.onlyNotifyLowestPriceDrops);

      if (!minimumPriceDrop || !minimumPriceDropPerc || !onlyShowLowestPrices) {
        console.error('Discord ayarları alınamadı!', {
          minimumPriceDrop,
          minimumPriceDropPerc,
          onlyShowLowestPrices
        });

        return;
      }

      if (priceHistory.newPrice < priceHistory.oldPrice && priceChange.priceDiff >= +minimumPriceDrop.value) {
        if (onlyShowLowestPrices.value === '1' && priceHistory.newPrice > (product.lowestPrice ?? 0)) {
          discordNotification = false;
        }

        if (minimumPriceDropPerc.value !== '0' && priceChange.priceDiffPerc < +minimumPriceDropPerc.value) {
          discordNotification = false;
        }

        if (discordConfig.notifyChannelId && discordNotification) {
          const notifyChannel = discord.channels.cache.get(discordConfig.notifyChannelId);
          if (notifyChannel?.isText()) {
            notifyChannel.send({
              embeds: [productPriceDropEmbed(priceChange)]
            });
          }
        }
      }
    }

    const productResult: ProductParseResultInterface = {
      product,
      parsedData: parsedProductData
    };

    await ProductController.upsertProduct(productResult);

    this.products = this.products.filter((trackerProduct: ProductTrackerProductInterface) => trackerProduct.product.id !== product.id);
  };

  workerDisconnect = (worker: Worker) => {
    if (this.products.some((product) => product.worker?.id === worker.id)) {
      this.products = this.products.map((product) => {
        if (product.worker?.id === worker.id) {
          product.worker = undefined;
        }

        return product;
      });
    }
  };

  stop = async () => {
    console.log('Stopping Product Tracker... ' + dayjs().toString());

    clearInterval(this.interval);

    this.status = false;
    this.interval = undefined;
  };
}

export default ProductTracker;
