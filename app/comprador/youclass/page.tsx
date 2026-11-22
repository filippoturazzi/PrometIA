import { PageHeader } from "@/components/PageHeader";
import { getProduct } from "@/lib/data";
import { DEMO_PRODUCT_ID } from "@/lib/demo";
import { YouClass } from "./YouClass";

export default function YouClassPage() {
  const product = getProduct(DEMO_PRODUCT_ID)!;
  return (
    <>
      <PageHeader
        eyebrow="Comprador · Depois da venda"
        title="YouClass: check-in"
        subtitle="Dentro da área de membros, um check-in de um toque pergunta se o produto está sendo o esperado, antes de o comprador pedir reembolso."
      />
      <YouClass product={{ name: product.name, producer: product.producer, modules: product.contentOutline ?? [] }} />
    </>
  );
}
