import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const META = navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";

const SHORTCUTS = [
  { keys: [META, "K"], label: "Abrir busca rápida" },
  { keys: [META, "/"], label: "Alternar tema" },
  { keys: ["G", "D"], label: "Ir para o Painel" },
  { keys: ["G", "G"], label: "Ir para Gastos" },
  { keys: ["G", "P"], label: "Ir para Parcelamentos" },
  { keys: ["G", "C"], label: "Ir para Posso Comprar?" },
  { keys: ["G", "S"], label: "Ir para Configurações" },
  { keys: ["?"], label: "Mostrar este diálogo" },
];

export function ShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>
            Atalhos úteis para navegar pelo app sem usar o mouse.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map((sc) => (
            <li
              key={sc.label}
              className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
            >
              <span>{sc.label}</span>
              <span className="flex items-center gap-1">
                {sc.keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-background px-1.5 text-xs font-medium shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
