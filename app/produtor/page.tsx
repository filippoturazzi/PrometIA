import { PageHeader } from "@/components/PageHeader";
import { PromiseHealth } from "@/components/PromiseHealth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProducers } from "@/lib/data";

export default function ProdutorPage() {
  const producers = getProducers();

  return (
    <>
      <PageHeader
        eyebrow="Produtor · Aprendizado"
        title="Saúde da Promessa dos seus produtos"
        subtitle="O mesmo painel de Operações, só com os seus produtos: quais creators e promessas geram reembolso e quais casos pedem resposta."
      />
      <Tabs defaultValue={producers[0]}>
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          Você está como
          <TabsList>
            {producers.map((p) => (
              <TabsTrigger key={p} value={p}>
                {p}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {producers.map((p) => (
          <TabsContent key={p} value={p}>
            <PromiseHealth audience="produtor" filter={{ producer: p }} idSuffix={`-${p.toLowerCase().replace(/\s+/g, "-")}`} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
