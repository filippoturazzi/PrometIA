import { aggregateByContent, creatorKpis, getCreators, prohibitedComparison } from "@/lib/data";
import { DEMO_CREATOR_ID } from "@/lib/demo";
import { MeusConteudos, type CreatorView } from "./MeusConteudos";

export default function ConteudosPage() {
  // dados de todas as creators calculados no servidor; o filtro troca no cliente sem nova requisição
  const views: CreatorView[] = getCreators().map((creator) => {
    const cmp = prohibitedComparison({ creatorId: creator.id });
    return {
      id: creator.id,
      name: creator.name,
      handle: creator.handle,
      kpis: creatorKpis(creator.id),
      comparison:
        cmp.ratio != null && cmp.withProhibited.sales > 0 && cmp.withoutProhibited.sales > 0
          ? { with: cmp.withProhibited.refundRate, without: cmp.withoutProhibited.refundRate, ratio: cmp.ratio }
          : null,
      contents: aggregateByContent({ creatorId: creator.id }).map((a) => ({
        id: a.content.id,
        title: a.content.title,
        channel: a.content.channel,
        productName: a.product.name,
        sales: a.sales,
        refunds: a.refunds,
        refundRate: a.refundRate,
        worstStatus: a.worstStatus,
        riskiestClaim: a.riskiestClaim ? { text: a.riskiestClaim.text, status: a.riskiestClaim.status } : null,
      })),
    };
  });

  return <MeusConteudos views={views} defaultCreatorId={DEMO_CREATOR_ID} />;
}
