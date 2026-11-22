import { PromiseHealth } from "@/components/PromiseHealth";
import { getProducers, getProducts } from "@/lib/data";
import { ProducerView } from "./ProducerView";

export default function ProdutorPage() {
  const products = getProducts();
  const producers = getProducers().map((name) => ({
    name,
    products: products.filter((p) => p.producer === name).map((p) => p.name),
    panel: (
      <PromiseHealth
        audience="produtor"
        filter={{ producer: name }}
        idSuffix={`-${name.toLowerCase().replace(/\s+/g, "-")}`}
      />
    ),
  }));

  return <ProducerView producers={producers} />;
}
