import { Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getContents, getCreator, getProducts } from "@/lib/data";
import { DEMO_CREATOR_ID, DEMO_PRODUCT_ID, DEMO_SCRIPT } from "@/lib/demo";
import { Checador } from "./Checador";

export default function ChecadorPage() {
  const creator = getCreator(DEMO_CREATOR_ID)!;
  const products = getProducts().map((p) => ({ id: p.id, name: p.name, slug: p.slug }));
  // próximo id livre: o conteúdo checado da demo vira ct_013
  const nextContentId = `ct_${String(getContents().length + 1).padStart(3, "0")}`;

  return (
    <>
      <PageHeader
        eyebrow="Creator · Antes de postar"
        title="Checador de promessas"
        subtitle="Cole o roteiro antes de postar: a IA confere cada promessa com a página do produto e sugere uma versão verdadeira."
        actions={
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Info className="size-4 shrink-0" aria-hidden />
            O PrometIA orienta, não bloqueia. A decisão de publicar é sua.
          </p>
        }
      />
      <Checador
        creator={{ name: creator.name, handle: creator.handle }}
        products={products}
        defaultProductId={DEMO_PRODUCT_ID}
        exampleScript={DEMO_SCRIPT}
        nextContentId={nextContentId}
      />
    </>
  );
}
