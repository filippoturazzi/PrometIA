import { PageHeader } from "@/components/PageHeader";
import { getProduct } from "@/lib/data";
import { DEMO_PRODUCT_ID } from "@/lib/demo";
import { Obrigado } from "./Obrigado";

export default function ObrigadoPage() {
  const product = getProduct(DEMO_PRODUCT_ID)!;
  return (
    <>
      <PageHeader
        eyebrow="Comprador · Depois da venda"
        title="Página de obrigado"
        subtitle="Logo depois da compra, o comprador diz o que espera do produto: a expectativa fica registrada antes de virar frustração."
      />
      <Obrigado product={{ name: product.name, producer: product.producer, price: product.price, chips: product.expectationChips }} />
    </>
  );
}
