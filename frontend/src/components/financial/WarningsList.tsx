import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  warnings: string[];
}

export function WarningsList({ warnings }: Props) {
  if (!warnings.length) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5 animate-slide-up">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          Atenção
        </div>
        <ul className="space-y-2 text-sm">
          {warnings.map((warning, i) => (
            <li
              key={i}
              className="flex gap-2 rounded-md border border-amber-500/20 bg-background/60 p-3"
            >
              <span
                aria-hidden
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
              />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
