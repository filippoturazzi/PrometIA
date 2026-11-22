/** Link exclusivo de um conteúdo checado (seção 10, M1). */
export function contentLink(handle: string, productSlug: string, contentId: string) {
  return `youshop.co/r/${handle}/${productSlug}?c=${contentId}`;
}
