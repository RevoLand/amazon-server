import { WebSocket } from 'ws';
import WorkerStateEnum from '../helpers/enums/WorkerStateEnum';

interface WorkerInterface {
  id: string;
  webSocket: WebSocket;
  ip?: string;
  state: WorkerStateEnum;
  isAlive: boolean;
}

export default WorkerInterface;
