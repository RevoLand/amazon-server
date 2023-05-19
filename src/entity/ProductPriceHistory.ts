import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import Product from './Product.js';

@Entity('product_price_histories')
class ProductPriceHistory extends BaseEntity {
    @PrimaryGeneratedColumn()
      id: number;

    @Column({
      name: 'product_detail_id'
    })
      productId: number;

    @Column('decimal', {
      name: 'old_price',
      precision: 14,
      scale: 2,
    })
      oldPrice: number;

    @Column('decimal', {
      name: 'new_price',
      precision: 14,
      scale: 2,
    })
      newPrice: number;

    @Column('boolean', {
      name: 'prime_only',
      default: 0,
    })
      primeOnly: boolean;

    @CreateDateColumn({
      name: 'created_at'
    })
      createdAt: Date;

    @ManyToOne(() => Product, product => product.priceHistories, {
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
    })
    @JoinColumn({
      name: 'product_detail_id',
      referencedColumnName: 'id'
    })
      product: Relation<Product>;
}

export default ProductPriceHistory;
