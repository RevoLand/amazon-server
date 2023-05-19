import Product from '../entity/Product.js';

interface CreateProductFromUrlResultInterface {
  productDetail: Product,
  existingProduct: boolean
}

export default CreateProductFromUrlResultInterface;
