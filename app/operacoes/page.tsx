import { PageHeader } from "@/components/PageHeader";
import { PromiseHealth } from "@/components/PromiseHealth";

export default function OperacoesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operações YouShop · Aprendizado"
        title="Saúde da promessa"
        subtitle="Quais produtos, creators e promessas geram reembolso — e a fila de casos para agir antes de virarem reclamação pública."
      />
      <PromiseHealth audience="operacoes" />
    </>
  );
}
