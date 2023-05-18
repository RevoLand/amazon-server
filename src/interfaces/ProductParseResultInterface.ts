import Product from '../entity/Product';
import ProductParserInterface from './ProductParserInterface';

interface ProductParseResultInterface {
  product: Product | null,
  parsedData: ProductParserInterface,
  sellerId?: string | undefined,
  psc?: number | undefined
}

export default ProductParseResultInterface;
