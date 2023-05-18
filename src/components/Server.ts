import { RawData, WebSocketServer } from 'ws';
import { discord } from '../app';
import webSocket from '../config/webSocket';
import ProductController from '../controller/ProductController';
import productCreatedEmbed from '../helpers/embeds/productCreatedEmbed';
import productUpdated from '../helpers/embeds/productUpdatedEmbed';
import CreateProductFromUrlResultInterface from '../interfaces/CreateProductFromUrlResultInterface';
import ProductParseResultInterface from '../interfaces/ProductParseResultInterface';
import TrackingResponseInterface from '../interfaces/TrackingResponseInterface';
import ProductTracker from './product/ProductTracker';
import Worker from './worker/Worker';
import WorkerPool from './worker/WorkerPool';

class Server {
  socketServer: WebSocketServer;

  workerPool: WorkerPool;

  productTracker: ProductTracker;

  private handleWorkerMessage = (worker: Worker) => async (data: RawData) => {
    try {
      const messageObject: {
        type: string;
        value: string;
        data: string;
        channelId: string;
      } = JSON.parse(data.toString());

      if (messageObject.type === 'begin-tracking-handshake') {
        this.productTracker.beginTrackingHandshake(+messageObject.value, worker);

        return;
      }

      if (messageObject.type === 'track-result') {
        const trackResult: TrackingResponseInterface = {
          productId: +messageObject.value,
          parserResult: JSON.parse(messageObject.data)
        };

        this.productTracker.handleTrackingResponse(trackResult, worker);
        return;
      }

      if (messageObject.type === 'create-result') {
        const urlParameters = (new URL(messageObject.value)).searchParams;
        const sellerId = urlParameters.has('smid') ? urlParameters.get('smid') ?? '' : undefined;
        const psc = urlParameters.has('psc') ? Number(urlParameters.get('psc')) : undefined;
        const parsedProductData = JSON.parse(messageObject.data);

        const productResult: ProductParseResultInterface = {
          product: await ProductController.byAsinAndLocale(parsedProductData.asin, parsedProductData.locale),
          parsedData: parsedProductData,
          psc,
          sellerId: sellerId
        };

        const result: CreateProductFromUrlResultInterface = {
          productDetail: await ProductController.upsertProduct(productResult),
          existingProduct: !! productResult.product
        };

        const discordChannel = discord.channels.cache.get(messageObject.channelId);

        if (discordChannel?.isText()) {
          const productEmbed = result.existingProduct ? productUpdated(result.productDetail) : productCreatedEmbed(result.productDetail);

          discordChannel.send({
            embeds: [productEmbed]
          });
        }

        return;
      }
    } catch (error) {
      console.error('Error parsing message for Worker: ', worker.id, error);
    }
  };

  initialize = () => {
    if (this.socketServer) {
      this.socketServer.close();

      this.workerPool.clear();
    } else {
      this.workerPool = new WorkerPool();
      this.productTracker = new ProductTracker();
    }

    this.socketServer = new WebSocketServer({
      host: webSocket.host,
      port: webSocket.port,
      verifyClient: ({ req }, cb) => {
        const secret = req.headers['authorization'];

        if (!secret || secret !== webSocket.secret) {
          cb(false, 401, 'Unauthorized');

          console.info('WebSocket Unauthorized Client', {
            remoteAddress: req.socket.remoteAddress,
            secret
          });

          return;
        }

        cb(true);
      }
    }, () => {
      console.log('WebSocket Server is listening for clients.', this.socketServer.address());

      this.productTracker.start();
    });

    this.socketServer.on('connection', (ws, req) => {
      const worker = new Worker(ws, req.socket.remoteAddress);
      console.log('WebSocket connection: ', worker.id);

      ws.on('error', (error) => {
        // TODO: error handling?
        console.error('WebSocket Error for Worker: ', worker.id, error);
      });

      ws.on('message', this.handleWorkerMessage(worker));

      ws.on('pong', () => {
        worker.isAlive = true;
      });

      ws.on('close', () => {
        console.log('WebSocket Close for Worker: ', worker.id);

        this.workerPool.remove(worker);
      });

      this.workerPool.add(worker);
    });

    const heartbeatInterval = setInterval(() => {
      this.workerPool.workers.forEach((worker) => {
        if (worker.isAlive === false) {
          console.log('terminate edeceğiz?', worker);
          worker.webSocket.terminate();

          return;
        }

        worker.isAlive = false;
        worker.webSocket.ping();
      });
    }, 15000);

    this.socketServer.on('close', () => {
      clearInterval(heartbeatInterval);
    });
  };
}

export default Server;
