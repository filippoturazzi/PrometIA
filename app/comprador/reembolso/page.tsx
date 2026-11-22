import { PageHeader } from "@/components/PageHeader";
import { getContent, getCreator, getFeedbackById, getProduct, getSale } from "@/lib/data";
import { DEMO_CONTENT_ID, DEMO_FEEDBACK_ID, DEMO_REFUND_TEXT } from "@/lib/demo";
import { contentLink } from "@/lib/links";
import { Reembolso } from "./Reembolso";

export default function ReembolsoPage() {
  const content = getContent(DEMO_CONTENT_ID)!;
  const product = getProduct(content.productId)!;
  const creator = getCreator(content.creatorId)!;
  // a compra da demo é a venda do caso fb_demo (o mesmo que aparece na fila de Operações)
  const sale = getSale(getFeedbackById(DEMO_FEEDBACK_ID)!.saleId)!;
  const purchasedAt = new Date(sale.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <>
      <PageHeader
        eyebrow="Comprador · Depois da venda"
        title="Solicitar reembolso"
        subtitle="O comprador conta o que esperava; a IA entende o motivo e liga o pedido ao conteúdo que gerou a venda. O reembolso nunca é escondido."
      />
      <Reembolso
        order={{
          number: "48213",
          productId: product.id,
          productName: product.name,
          producer: product.producer,
          price: product.price,
          purchasedAt,
          contentId: content.id,
          contentTitle: content.title,
          contentChannel: content.channel,
          creatorName: creator.name,
          link: contentLink(creator.handle, product.slug, content.linkId),
          claims: content.claims.map((c) => ({ text: c.text, status: c.status })),
          expectation: sale.expectation ?? null,
        }}
        exampleText={DEMO_REFUND_TEXT}
      />
    </>
  );
}
