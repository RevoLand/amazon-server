import Worker from './Worker.js';

class WorkerPool {
  workers: Worker[];

  constructor(workers: Worker[] = []) {
    this.workers = workers;
  }

  // ekle
  add(worker: Worker): void {
    this.workers.push(worker);
  }

  // müsait işçi listesi
  availableWorkers(): Worker[] {
    return this.workers.filter(worker => worker.state === 'idle');
  }

  // TODO: en müsait işçiyi bul
  getAvailableWorker(): Worker {
    return this.availableWorkers()[0];
  }

  // worker havuzu boş mu
  isEmpty(): boolean {
    return this.workers.length === 0;
  }

  // çıkar
  remove(worker: Worker): void {
    this.workers = this.workers.filter(w => w.id !== worker.id);
  }

  clear(): void {
    this.workers = [];
  }
}

export default WorkerPool;
