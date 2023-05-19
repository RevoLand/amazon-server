import Product from '../entity/Product.js';
import ProductPriceHistory from '../entity/ProductPriceHistory.js';
import ProductParserInterface from './ProductParserInterface.js';

interface PriceChangeInterface {
  product: Product,
  parsedProductData: ProductParserInterface,
  priceHistory: ProductPriceHistory,
  priceDiff: number,
  lowestPriceDiff: number,
  priceDiffPerc: number,
  lowestPriceDiffPerc: number
}

export default PriceChangeInterface;
