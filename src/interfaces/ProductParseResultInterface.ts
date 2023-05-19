import Product from '../entity/Product.js';
import ProductParserInterface from './ProductParserInterface.js';

interface ProductParseResultInterface {
  product: Product | null,
  parsedData: ProductParserInterface,
  sellerId?: string | undefined,
  psc?: number | undefined
}

export default ProductParseResultInterface;
