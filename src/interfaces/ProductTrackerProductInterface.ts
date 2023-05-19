import dayjs from 'dayjs';
import Worker from '../components/worker/Worker.js';
import Product from '../entity/Product.js';

interface ProductTrackerProductInterface {
  product: Product,
  worker?: Worker,
  addedToListAt: dayjs.Dayjs,
}

export default ProductTrackerProductInterface;
