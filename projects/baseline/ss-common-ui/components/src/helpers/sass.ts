

export function numValue(pixelsCss: string) {
  // tslint:disable-next-line:radix
  return parseInt(pixelsCss.replace('px', ''));
}
