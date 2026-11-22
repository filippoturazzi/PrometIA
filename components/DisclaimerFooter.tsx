import { Logo } from "@/components/Header";

export function DisclaimerFooter() {
  return (
    <footer className="bg-navy-deep">
      <div className="mx-auto flex max-w-[1248px] flex-wrap items-center justify-between gap-3 px-6 py-7">
        <Logo className="text-base" />
        <p className="text-[13px] text-white/50">
          Protótipo conceitual · Desafio de Inovação YouShop 2027 · não oficial · todos os
          dados são fictícios
        </p>
      </div>
    </footer>
  );
}
