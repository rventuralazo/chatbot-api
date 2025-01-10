import axios, { AxiosError } from 'axios';
import {
  getDeliveryPrice,
  getWeightFromProductDetails,
} from '../chatbot/utils/amazon';
const LoloAPI = process.env.LOLO_API_URL;
export async function unShortAmazonUrl(url: string) {
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
export async function getAmazonProductByASIN(asin) {
  if (asin) {
    const response = await axios.get(
      `${LoloAPI}/amazon/search?domain=com&query=${asin}&page=1`,
    );
    const data = response.data;
    const firstProduct = data.results?.[0];

    const responseDetail = await axios.get(
      `${LoloAPI}/amazon/detail?domain=com&asin=${asin}`,
    );
    const productDetail = responseDetail.data;

    let price = firstProduct?.price;
    if (firstProduct) {
      const weight = getWeightFromProductDetails(productDetail);
      const shippingPrice = getDeliveryPrice(productDetail.shipping_info) ?? 0;
      console.log('Weight', weight);
      console.log('Shipping', shippingPrice);
      console.log({
        source: 'AMAZON',
        price: Number(price.replace('$', '')),
        weight,
        shipping: shippingPrice,
      });
      const priceResponse = await axios.post(`${LoloAPI}/price/calculate`, {
        source: 'AMAZON',
        price: Number(price.replace('$', '')),
        weight,
        shipping: shippingPrice,
      });
      const priceData = priceResponse.data;
      console.log(`Price Data: ${JSON.stringify(priceData)}`);
      price = priceData.data.price;
    } else {
      return 'Producto no encontrado';
    }
    return `
      URL Imagen: ${firstProduct.image}
      ASIN: ${firstProduct.asin}
      Título: ${firstProduct.title}
      Precio: $${price}
    `;
  } else {
    return 'No se proporcionó un ASIN válido.';
  }
}

export async function getEbayProductById(id) {
  if (id) {
    const response = await axios.get(
      `${LoloAPI}/ebay/search?limit=20&offset=0&auto_correct=KEYWORD&q=${id}`,
    );
    const data = response.data;
    const firstProduct = data?.itemSummaries?.[0];
    // const shipping = product?.shippingOptions?.shippingCost?.value ?? 0
    let price = firstProduct?.price?.value;
    if (firstProduct) {
      const priceResponse = await axios.post(`${LoloAPI}/price/calculate`, {
        source: 'EBAY',
        price: Number(price),
      });
      const priceData = priceResponse.data;
      price = priceData.data.price;
    } else {
      return 'Producto no encontrado';
    }
    return `
      URL Imagen: ${firstProduct?.image?.imageUrl}
      ID: ${firstProduct?.id}
      Título: ${firstProduct?.title}
      Precio: ${price}
    `;
  } else {
    return 'No se proporcionó un ID válido.';
  }
}
export async function getSheinProductById(id) {
  if (id) {
    const response = await axios.get(
      `${LoloAPI}/shein/search?language=en&country=US&currency=USD&keywords=${id}&sort=7&limit=20&page=1`,
    );
    const data = response.data;
    const firstProduct = data?.info?.products?.[0];

    // Search -> Detail -> Legacy Detail
    // const price = Number.parseFloat(
    //   product.sale_price?.amount ?? product?.salePrice?.amount,
    // )
    const productDetail = await axios.get(
      `${LoloAPI}/shein/detail?language=en&country=US&currency=USD&goods_id=${id}`,
    );
    let price = productDetail.data.info?.sale_price?.amount;
    if (firstProduct && price) {
      const priceResponse = await axios.post(`${LoloAPI}/price/calculate`, {
        source: 'SHEIN',
        price: Number(price),
      });
      const priceData = priceResponse.data;
      price = priceData.data.price;
    } else {
      return 'Producto no encontrado';
    }
    return `
      URL Imagen: ${firstProduct?.goods_img}
      ID: ${firstProduct?.id}
      Título: ${firstProduct?.goods_name}
      Precio: ${price}
    `;
  } else {
    return 'No se proporcionó un ID válido.';
  }
}

export async function getOrderDetailsByOrderRef(orderRef) {
  if (orderRef) {
    try {
      const response = await axios.get(`${LoloAPI}/order/${orderRef}`);
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
  } else {
    return 'No se proporcionó una referencia de pedido válida.';
  }
}
export async function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}
export async function getMyOrders(phone: string) {
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
      `${LoloAPI}/order/phone/${phone}?filters=${encodeURI(JSON.stringify(filters))}`,
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
export async function searchProductByName(name: string) {
  if (name) {
    try {
      const searchTerm = encodeURI(name);
      const amazonResults = await axios.get(
        `${LoloAPI}/amazon/search?domain=com&query=${searchTerm}&page=1`,
      );
      const ebayResults = await axios.get(
        `${LoloAPI}/ebay/search?limit=20&offset=0&auto_correct=KEYWORD&q=${searchTerm}`,
      );
      const sheinResults = await axios.get(
        `${LoloAPI}/shein/search?language=en&country=US&currency=USD&keywords=${searchTerm}&sort=7&limit=20&page=1`,
      );
      const allResults = [];
      const amazonData = amazonResults.data.results?.slice(0, 3) ?? [];
      const ebayData = ebayResults.data.itemSummaries?.slice(0, 3) ?? [];
      const sheinData = sheinResults.data.info?.products?.slice(0, 3) ?? [];
      for (const amazonProduct of amazonData) {
        const productDetail = await axios.get(
          `${LoloAPI}/amazon/detail?domain=com&asin=${amazonProduct.asin}`,
        );
        const weight = getWeightFromProductDetails(productDetail.data) || null;
        const shippingPrice = getDeliveryPrice(
          productDetail.data.shipping_info,
        );
        console.log('Weight', weight);
        console.log('Shipping', shippingPrice);

        const priceResponse = await axios.post(`${LoloAPI}/price/calculate`, {
          source: 'AMAZON',
          price: Number(amazonProduct.price?.replace('$', '')),
          weight,
          shipping: shippingPrice,
        });
        const priceData = priceResponse.data;
        if (weight ?? 0 <= 20) {
          allResults.push(`
            URL Imagen: ${amazonProduct.image}
            ASIN: ${amazonProduct.asin}
            Título: ${amazonProduct.title}
            Precio: ${priceData.data.price}
            Tienda: Amazon
          `);
        }
      }
      for (const ebayProduct of ebayData) {
        const priceResponse = await axios.post(`${LoloAPI}/price/calculate`, {
          source: 'EBAY',
          price: Number(ebayProduct.price.value),
        });
        const priceData = priceResponse.data;
        allResults.push(`
          URL Imagen: ${ebayProduct.image?.imageUrl}
          ID: ${ebayProduct.itemId}
          Título: ${ebayProduct.title}
          Precio: ${priceData.data.price}
          Tienda: Ebay
        `);
      }
      for (const sheinProduct of sheinData) {
        const productDetail = await axios.get(
          `${LoloAPI}/shein/detail?language=en&country=US&currency=USD&goods_id=${sheinProduct?.goods_id}`,
        );
        const price = productDetail.data.info?.sale_price?.amount;
        const priceResponse = await axios.post(`${LoloAPI}/price/calculate`, {
          source: 'SHEIN',
          price: Number(price),
        });
        const priceData = priceResponse.data;
        allResults.push(`
          URL Imagen: ${sheinProduct?.goods_img}
          ID: ${sheinProduct?.goods_id}
          Título: ${sheinProduct?.goods_name}
          Precio: ${priceData.data.price}
          Tienda: Shein
        `);
      }
      return allResults.join('\n');
    } catch (error) {
      console.log(error);
      return 'En este momento no se puede consultar el producto, intente mas tarde';
    }
  }
}
