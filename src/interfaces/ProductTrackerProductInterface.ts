import dayjs from 'dayjs';
import Worker from '../components/worker/Worker';
import Product from '../entity/Product';

interface ProductTrackerProductInterface {
  product: Product,
  worker?: Worker,
  addedToListAt: dayjs.Dayjs,
}

export default ProductTrackerProductInterface;
