import { getCreator, getProduct } from "@/lib/data";
import { DEMO_CREATOR_ID, DEMO_PRODUCT_ID } from "@/lib/demo";
import { Obrigado } from "./Obrigado";

export default function ObrigadoPage() {
  const product = getProduct(DEMO_PRODUCT_ID)!;
  const creator = getCreator(DEMO_CREATOR_ID)!;
  return (
    <Obrigado
      product={{ name: product.name, producer: product.producer, price: product.price, chips: product.expectationChips }}
      creatorHandle={creator.handle}
    />
  );
}
