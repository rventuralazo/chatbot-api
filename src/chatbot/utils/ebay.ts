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
