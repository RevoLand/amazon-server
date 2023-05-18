import { nanoid } from 'nanoid';
import { WebSocket } from 'ws';
import WorkerStateEnum from '../../helpers/enums/WorkerStateEnum';
import ProductTrackerProductInterface from '../../interfaces/ProductTrackerProductInterface';
import WorkerInterface from '../../interfaces/WorkerInterface';

class Worker implements WorkerInterface {
  id: string;

  webSocket: WebSocket;

  ip?: string;

  state: WorkerStateEnum;

  isAlive: boolean;

  constructor(webSocket: WebSocket, ip?: string) {
    this.id = nanoid();

    this.webSocket = webSocket;

    this.ip = ip;

    this.state = WorkerStateEnum.idle;

    this.isAlive = true;
  }

  updateState(state: WorkerStateEnum) {
    this.state = state;

    console.log(`[${this.id}] worker state update, new state: ${state}`);
  }

  beginProductTracking = (product: ProductTrackerProductInterface) => {
    this.webSocket.send(JSON.stringify({
      type: 'begin-tracking',
      value: JSON.stringify({
        productId: product.product.id,
        url: product.product.getUrl(),
      })
    }));
  };

  createProductTracking = (productUrl: string, channelId?: string) => {
    this.webSocket.send(JSON.stringify({
      type: 'create-tracking',
      value: productUrl,
      channelId
    }));
  };
}

export default Worker;
