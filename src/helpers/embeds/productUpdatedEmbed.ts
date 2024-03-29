import { MessageEmbed } from 'discord.js';
import Product from '../../entity/Product.js';

const productUpdated = (product: Product): MessageEmbed => {
  const embed = new MessageEmbed()
    .setTitle(product.name ?? '')
    .setDescription('Ürün zaten takip ediliyor.')
    .setURL(product.getUrl())
    .addField('Güncel Fiyat', '' + product.currentPrice, true)
    .addField('En Düşük Fiyat', '' + product.lowestPrice, true)
    .addField('Takibe Başlandığı Fiyat', '' + product.price, true)
    .setAuthor(product.country)
    .setTimestamp(product.updatedAt);

  if (product.image) {
    embed.setThumbnail(product.image);
  }

  if (product.seller) {
    embed.setFooter('Satıcı: ' + product.seller);
  }

  return embed;
};

export default productUpdated;
