import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        A página que você está procurando não existe ou você não tem
        permissão para acessá-la.
      </p>
      <Button asChild>
        <Link to="/painel">Voltar para o painel</Link>
      </Button>
    </div>
  );
}
