import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDisciplineSettings } from "@/hooks/useDiscipline";
import type { DisciplineSettings } from "@/types/discipline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
const schema = z.object({
  max_leisure_percentage: z.coerce
    .number()
    .min(0, "Mínimo de 0%")
    .max(100, "Máximo de 100%"),
  max_installment_percentage: z.coerce
    .number()
    .min(0, "Mínimo de 0%")
    .max(100, "Máximo de 100%"),
  emergency_reserve_goal: z.coerce.number().min(0, "Informe um valor positivo"),
});
type Values = z.infer<typeof schema>;
export function DisciplineSettingsForm({
  settings,
}: {
  settings: DisciplineSettings;
}) {
  const mutation = useDisciplineSettings();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      max_leisure_percentage: Number(settings.max_leisure_percentage),
      max_installment_percentage: Number(settings.max_installment_percentage),
      emergency_reserve_goal: Number(settings.emergency_reserve_goal),
    },
  });
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await mutation.mutateAsync(values);
          form.reset(values);
        } catch {
          form.setError("root", {
            message: "Não foi possível salvar. Tente novamente.",
          });
        }
      })}
    >
      {(
        [
          {
            key: "max_leisure_percentage",
            label: "Limite para lazer (%)",
            max: 100,
          },
          {
            key: "max_installment_percentage",
            label: "Limite para parcelas (%)",
            max: 100,
          },
          {
            key: "emergency_reserve_goal",
            label: "Meta de reserva (R$)",
            max: undefined,
          },
        ] as const
      ).map(({ key, label, max }) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{label}</Label>
          <Input
            id={key}
            type="number"
            min={0}
            max={max}
            step="0.01"
            inputMode="decimal"
            aria-invalid={!!form.formState.errors[key]}
            aria-describedby={`${key}-error`}
            {...form.register(key)}
          />
          <p
            id={`${key}-error`}
            role="alert"
            className="text-xs text-destructive"
          >
            {form.formState.errors[key]?.message}
          </p>
        </div>
      ))}
      {form.formState.errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={
          mutation.isPending ||
          form.formState.isSubmitting ||
          !form.formState.isDirty
        }
      >
        {mutation.isPending ? "Salvando..." : "Salvar limites"}
      </Button>
    </form>
  );
}
