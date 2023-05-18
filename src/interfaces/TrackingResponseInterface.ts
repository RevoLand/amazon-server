import ProductParserInterface from './ProductParserInterface';

interface TrackingResponseInterface {
  productId: number;
  parserResult: ProductParserInterface;
}

export default TrackingResponseInterface;
