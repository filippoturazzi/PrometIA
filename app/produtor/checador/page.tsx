import { Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getProducts } from "@/lib/data";
import { DEMO_PRINT_PATHS, DEMO_PRODUCER_PRODUCT_ID, DEMO_SALES_PAGE_PATH } from "@/lib/demo";
import { PageChecker } from "./PageChecker";

export default function ChecadorProdutorPage() {
  const products = getProducts().map((p) => ({ id: p.id, name: p.name, producer: p.producer }));

  return (
    <>
      <PageHeader
        eyebrow="Produtor · Antes de divulgar"
        title="Checador da página de vendas"
        subtitle="Teste a sua página de vendas antes de divulgar: promessas exageradas viram reembolso."
        actions={
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Info className="size-4 shrink-0" aria-hidden />
            O PrometIA lê só o texto da página ou dos prints. Nada é publicado ou guardado.
          </p>
        }
      />
      <PageChecker
        products={products}
        defaultProductId={DEMO_PRODUCER_PRODUCT_ID}
        examplePath={DEMO_SALES_PAGE_PATH}
        examplePrints={DEMO_PRINT_PATHS}
      />
    </>
  );
}
