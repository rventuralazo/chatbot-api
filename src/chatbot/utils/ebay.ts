const MAX_PRODUCT_DIMENSION = 15;
export function getQuickestShippingDate(
  shippingOptions: string[],
): Date | null {
  return shippingOptions.length > 0
    ? new Date(
        shippingOptions.reduce((quickest, current) =>
          new Date(current) < new Date(quickest) ? current : quickest,
        ),
      )
    : null;
}
export const getEbayDimensions = (product: any): string[] | null => {
  if (!product) return null;
  const dimensions = (product.localizedAspects || [])
    .filter(
      (item: any) =>
        item.name.toLowerCase().includes('item height') ||
        item.name.toLowerCase().includes('item width') ||
        item.name.toLowerCase().includes('item length') ||
        item.name.toLowerCase().includes('item weight'),
    )
    .map((item: any) => item.value.replace(/[^\d.]/g, ''))
    .filter(Boolean);
  return dimensions ?? null;
};

export const getEbayDimensionCap = (product: any): boolean => {
  const validateDimensions = (dimensions: string[]) => {
    const values = dimensions.map((value) => Number.parseFloat(value.trim()));
    return values.every((value) => value <= MAX_PRODUCT_DIMENSION);
  };
  if (!product) return true;
  const dimensions = getEbayDimensions(product);
  return dimensions ? validateDimensions(dimensions) : true;
};
