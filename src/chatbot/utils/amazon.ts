const MAX_PRODUCT_DIMENSION = 15;
export function getAsinFromUrl(url: string) {
  const match = url?.match(
    /(?:\/(?:dp|gp(?:\/(?:product|aw\/d|slredirect\/p))?|product)\/([\da-z]{10}))/i,
  );
  return match ? match[1] : null;
}

export const calculateWeight = (infoWeigthAmazon: any) => {
  const infoValue =
    infoWeigthAmazon && typeof infoWeigthAmazon === 'object'
      ? infoWeigthAmazon?.value
      : infoWeigthAmazon;
  const cleanString = (infoValue || '')
    ?.toString()
    ?.replace(/[^\u0020-\u007E]/g, '');
  const [weightString, type] = cleanString?.split(' ') || [];
  let weight = Number.parseFloat(weightString) || 0;
  const lowerType = type?.toLowerCase() || '';
  switch (true) {
    case lowerType.includes('ounces'): {
      weight /= 16;
      break;
    }
    case lowerType.includes('kilograms'): {
      weight *= 2.204_62;
      break;
    }
    case lowerType.includes('grams'): {
      weight /= 453.592;
      break;
    }
    default: {
      break;
    }
  }
  return Number.parseFloat(weight.toFixed(2));
};

export const getWeightFromProductDetails = (product: any) => {
  if (!product) return null;
  const weight =
    Object.entries(product.product_information || {}).find(
      ([key]) =>
        key.toLowerCase().includes('weight') ||
        key.toLowerCase().includes('item weight') ||
        key.toLowerCase().includes('dimensiones del producto'),
    )?.[1] || null;
  return weight ? calculateWeight(weight) : null;
};

export const getWeightFromProductDimensions = (product: any) => {
  if (!product) return null;
  function extractProductWeight(dimensions: string) {
    if (!dimensions) return null;
    const regex = /(\d+(\.\d+)?)\s*(ounces?|grams?|pounds?|kilograms?)/i;
    const match = dimensions.toLowerCase().match(regex);
    return match ? match[0] : null;
  }
  const dimensions = getProductDimensions(product);
  return dimensions ? calculateWeight(extractProductWeight(dimensions)) : null;
};

export const getProductDimensions = (product: any): string | null => {
  if (!product) return null;
  const dimensions = Object.entries(product.product_information || {}).find(
    ([key]) =>
      key.toLowerCase().includes('package dimensions') ||
      key.toLowerCase().includes('product dimensions') ||
      key.toLowerCase().includes('item dimensions'),
  );
  return dimensions ? (dimensions[1] as string) : null;
};

export const getDimensionCap = (product: any): boolean => {
  const validateDimensions = (dimensions: string) => {
    const values = dimensions
      .replace('inches', '')
      .split('x')
      .map((value) => Number.parseFloat(value.trim()));
    return values.every((value) => value <= MAX_PRODUCT_DIMENSION);
  };
  if (!product) return true;
  const dimensions = getProductDimensions(product);
  return dimensions ? validateDimensions(dimensions) : true;
};

export function getDeliveryPrice(shipping_info: any) {
  if (shipping_info?.toLowerCase().includes('free')) return 0;
  const match = shipping_info?.match(/\$\d+(\.\d{1,2})?/g);
  return match ? Number.parseFloat(match[0].replace(/[^\d.]/g, '')) : 0;
}
