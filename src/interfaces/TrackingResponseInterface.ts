import ProductParserInterface from './ProductParserInterface.js';

interface TrackingResponseInterface {
  productId: number;
  parserResult: ProductParserInterface;
}

export default TrackingResponseInterface;
