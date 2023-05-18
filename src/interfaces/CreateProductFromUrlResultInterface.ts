import Product from '../entity/Product';

interface CreateProductFromUrlResultInterface {
  productDetail: Product,
  existingProduct: boolean
}

export default CreateProductFromUrlResultInterface;
