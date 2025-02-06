import axios, { AxiosError } from 'axios';
import {
  getDeliveryPrice,
  getWeightFromProductDetails,
} from '../chatbot/utils/amazon';
import { Injectable } from '@nestjs/common';
import { AmazonService } from '../amazon/amazon.service';
import { EbayService } from '../ebay/ebay.service';
import { SheinService } from '../shein/shein.service';
@Injectable()
export class AssistantActionService {
  private readonly loloAPI: string;

  constructor(
    private readonly amazonService: AmazonService,
    private readonly ebayService: EbayService,
    private readonly sheinService: SheinService,
  ) {
    this.loloAPI = process.env.LOLO_API_URL;
  }

  async unShortAmazonUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let urlRequest = url;
      if (
        !urlRequest.startsWith('https://') &&
        !urlRequest.startsWith('http://')
      ) {
        urlRequest = 'https://' + url;
      }
      fetch(urlRequest)
        .then((response) => {
          resolve(response.url);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async getAmazonProductByASIN(asin: string): Promise<string> {
    if (!asin) return 'No se proporcionó un ASIN válido.';
    try {
      const response = await axios.get(
        `${this.loloAPI}/amazon/search?domain=com&query=${asin}&page=1`,
      );
      const data = response.data;
      const firstProduct = data.results?.[0];

      if (!firstProduct) return 'Producto no encontrado';

      const responseDetail = await axios.get(
        `${this.loloAPI}/amazon/detail?domain=com&asin=${asin}`,
      );
      const productDetail = responseDetail.data;

      let price = firstProduct?.price;
      let weight = getWeightFromProductDetails(productDetail);
      const shippingPrice = getDeliveryPrice(productDetail.shipping_info) ?? 0;

      console.log('Weight', weight);
      console.log('Shipping', shippingPrice);
      console.log({
        source: 'AMAZON',
        price: Number(price.replace('$', '')),
        weight,
        shipping: shippingPrice,
      });

      if (weight && weight < 0.25) weight = 0.25;
      const priceResponse = await axios.post(
        `${this.loloAPI}/price/calculate`,
        {
          source: 'AMAZON',
          price: Number(price.replace('$', '')),
          weight,
          shipping: shippingPrice,
        },
      );
      const priceData = priceResponse.data;
      price = priceData.data.price;
      const estimatedDeliveryDate =
        await this.amazonService.getEstimatedDeliveryDate(productDetail);

      return `
        URL Imagen: ${firstProduct.image}
        ASIN: ${firstProduct.asin}
        Título: ${firstProduct.title}
        Fecha de Llegada: ${estimatedDeliveryDate.toISOString().split('T')[0]}
        Precio: $${price}
      `;
    } catch {
      return 'No se ha podido obtener la información del producto';
    }
  }

  async getEbayProductById(id: string): Promise<string> {
    if (!id) return 'No se proporcionó un ID válido.';
    try {
      const response = await axios.get(
        `${this.loloAPI}/ebay/search?limit=20&offset=0&auto_correct=KEYWORD&q=${id}`,
      );
      const data = response.data;
      const firstProduct = data?.itemSummaries?.[0];

      if (!firstProduct) return 'Producto no encontrado';

      let price = firstProduct?.price?.value;
      let weight = firstProduct?.weight;
      if (weight) weight = Number.parseFloat(weight);
      if (weight && weight < 0.25) weight = 0.25;
      const priceResponse = await axios.post(
        `${this.loloAPI}/price/calculate`,
        {
          source: 'EBAY',
          price: Number(price),
          weight: weight ?? null,
        },
      );
      const proructDetail = await axios.get(
        `${this.loloAPI}/ebay/detail/${encodeURI(`v1|${id}|0`)}`,
      );
      const priceData = priceResponse.data;
      price = priceData.data.price;
      const estimatedDeliveryDate =
        await this.ebayService.getEstimatedDeliveryDate(proructDetail.data);
      console.log('Ebay Estimated Delivery Date', estimatedDeliveryDate);
      return `
        URL Imagen: ${firstProduct?.image?.imageUrl}
        ID: ${firstProduct?.id}
        Título: ${firstProduct?.title}
        Fecha de Llegada: ${estimatedDeliveryDate.toISOString().split('T')[0]}
        Precio: ${price}
      `;
    } catch {
      return 'No se ha podido obtener la información del producto';
    }
  }

  async getSheinProductById(id: string): Promise<string> {
    if (!id) return 'No se proporcionó un ID válido.';

    const response = await axios.get(
      `${this.loloAPI}/shein/search?language=en&country=US&currency=USD&keywords=${id}&sort=7&limit=20&page=1`,
    );
    const data = response.data;
    const firstProduct = data?.info?.products?.[0];

    const productDetail = await axios.get(
      `${this.loloAPI}/shein/detail?language=en&country=US&currency=USD&goods_id=${id}`,
    );
    let price = productDetail.data.info?.sale_price?.amount;

    if (!firstProduct || !price) return 'Producto no encontrado';

    const priceResponse = await axios.post(`${this.loloAPI}/price/calculate`, {
      source: 'SHEIN',
      price: Number(price),
    });
    const priceData = priceResponse.data;
    price = priceData.data.price;

    const estimatedDeliveryDate =
      await this.sheinService.getEstimatedDeliveryDate();

    return `
      URL Imagen: ${firstProduct?.goods_img}
      ID: ${firstProduct?.id}
      Título: ${firstProduct?.goods_name}
      Fecha de Llegada: ${estimatedDeliveryDate.toISOString().split('T')[0]}
      Precio: ${price}
    `;
  }

  async getOrderDetailsByOrderRef(orderRef: string): Promise<string> {
    if (!orderRef) return 'No se proporcionó una referencia de pedido válida.';

    try {
      const response = await axios.get(`${this.loloAPI}/order/${orderRef}`);
      const data = response.data;
      return `
        ID: ${data.id}
        Estado: ${data.status}
        Producto: ${data.product.nameProduct}
        Fecha de Llegada: ${data.arrivalDate}
        Total: ${data.total}
      `;
    } catch {
      return 'En este momento no se puede consultar el pedido, intente mas tarde';
    }
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  async getMyOrders(phone: string): Promise<string> {
    try {
      const filters = [
        {
          field: 'status',
          operator: 'in',
          value: [
            'Orden Confirmada',
            'Producto Comprado',
            'Producto en Camino',
            'Recibido en Sucursal',
            'Delivery o Listo para ser retirado',
            'Entregado',
          ],
        },
      ];
      const response = await axios.get(
        `${this.loloAPI}/order/phone/${phone}?filters=${encodeURI(JSON.stringify(filters))}`,
      );
      const data = response.data.data.bulk;
      return `
        ${data
          .map((order) => {
            return `
            ID: ${order.id}
            Estado: ${order.status}
            Producto: ${order.product.nameProduct}
            Fecha de Llegada: ${order.arrivalDate}
            URL: ${order.product.urlProduct}
            Total: ${order.total}
          `;
          })
          .join('\n')}
      `;
    } catch (error) {
      console.log('Error al obtener los pedidos', error);
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          return 'No se encontraron pedidos.';
        }
      }
      return 'En este momento no se puede consultar sus pedidos, intente mas tarde, revisa que tu numero este registrado en tu cuenta de CompraLolo';
    }
  }
  async searchEbayProductByName(searchTerm: string): Promise<any> {
    try {
      const respnse = await axios.get(
        `${this.loloAPI}/ebay/search?limit=20&offset=0&auto_correct=KEYWORD&q=${searchTerm}`,
      );
      return respnse;
    } catch {
      console.log('Error al buscar el producto en ebay');
    }
  }

  async searchProductByName(name: string): Promise<string> {
    if (!name) return 'No se proporcionó un nombre de producto válido.';
    console.log(
      `:::::::::: BUSCANDO: ${name.replace(/ site:[^\s]+/g, '')} :::::::::::`,
    );
    try {
      const searchTerm = encodeURI(name.replace(/ site:[^\s]+/g, ''));
      const [amazonResults, ebayResults, sheinResults] = await Promise.all([
        axios.get(
          `${this.loloAPI}/amazon/search?domain=com&query=${searchTerm}&page=1`,
        ),
        this.searchEbayProductByName(searchTerm),
        axios.get(
          `${this.loloAPI}/shein/search?language=en&country=US&currency=USD&keywords=${searchTerm}&sort=7&limit=20&page=1`,
        ),
      ]);

      const allResults = [];
      const amazonData = amazonResults?.data?.results?.slice(0, 3) ?? [];
      const ebayData = ebayResults?.data?.itemSummaries?.slice(0, 3) ?? [];
      const sheinData = sheinResults?.data?.info?.products?.slice(0, 3) ?? [];

      for (const amazonProduct of amazonData) {
        if (!amazonProduct.asin) continue;
        const productDetail = await axios.get(
          `${this.loloAPI}/amazon/detail?domain=com&asin=${amazonProduct.asin}`,
        );
        let weight = getWeightFromProductDetails(productDetail.data) || null;
        if (weight && weight < 0.25) weight = 0.25;
        const shippingPrice = getDeliveryPrice(
          productDetail.data.shipping_info,
        );

        if (amazonProduct.price) {
          const priceResponse = await axios.post(
            `${this.loloAPI}/price/calculate`,
            {
              source: 'AMAZON',
              price: Number(amazonProduct.price?.replace('$', '')),
              weight,
              shipping: shippingPrice,
            },
          );
          const priceData = priceResponse.data;
          console.log('Amazon Product', JSON.stringify(amazonProduct));
          const estimatedDeliveryDate =
            await this.amazonService.getEstimatedDeliveryDate(
              productDetail.data,
            );

          if (weight ?? 0 <= 20) {
            allResults.push(`
              URL Imagen: ${productDetail.data.images?.at(0)}
              ASIN: ${amazonProduct.asin}
              Título: ${amazonProduct.title}
              Precio: ${priceData.data.price}
              Fecha de Llegada: ${estimatedDeliveryDate.toISOString().split('T')[0]}
              Tienda: Amazon
            `);
          }
        }
      }
      for (const ebayProduct of ebayData) {
        try {
          const priceResponse = await axios.post(
            `${this.loloAPI}/price/calculate`,
            {
              source: 'EBAY',
              price: Number(ebayProduct.price.value),
            },
          );
          const priceData = priceResponse.data;
          const proructDetail = await axios.get(
            `${this.loloAPI}/ebay/detail/${encodeURI(`${ebayProduct.itemId}`)}`,
          );
          const estimatedDeliveryDate =
            await this.ebayService.getEstimatedDeliveryDate(proructDetail.data);
          allResults.push(`
            URL Imagen: ${ebayProduct.image?.imageUrl}
            ID: ${ebayProduct.itemId}
            Título: ${ebayProduct.title}
            Precio: ${priceData.data.price}
            Fecha de Llegada: ${estimatedDeliveryDate.toISOString().split('T')[0]}
            Tienda: Ebay
          `);
        } catch (error) {
          console.log('Error al obtener el producto EBAY', error);
        }
      }

      for (const sheinProduct of sheinData) {
        try {
          const productDetail = await axios.get(
            `${this.loloAPI}/shein/detail?language=en&country=US&currency=USD&goods_id=${sheinProduct?.goods_id}`,
          );
          const price = productDetail.data.info?.sale_price?.amount;
          const priceResponse = await axios.post(
            `${this.loloAPI}/price/calculate`,
            {
              source: 'SHEIN',
              price: Number(price),
            },
          );
          const priceData = priceResponse.data;
          const estimatedDeliveryDate =
            await this.sheinService.getEstimatedDeliveryDate();
          allResults.push(`
          URL Imagen: ${sheinProduct?.goods_img}
          ID: ${sheinProduct?.goods_id}
          Título: ${sheinProduct?.goods_name}
          Precio: ${priceData.data.price}
          Fecha de Llegada: ${estimatedDeliveryDate.toISOString().split('T')[0]}
          Tienda: Shein
        `);
        } catch (error) {
          console.log('Error al obtener el producto SHEIN', error);
        }
      }

      return allResults.join('\n');
    } catch (error) {
      console.log(error);
      return 'En este momento no se puede consultar el producto, intente mas tarde';
    }
  }
}
