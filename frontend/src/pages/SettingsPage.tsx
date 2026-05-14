import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Sun,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useUser";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120),
});

type ProfileValues = z.infer<typeof profileSchema>;

const salarySchema = z.object({
  monthly_salary: z.coerce
    .number({ invalid_type_error: "Salário precisa ser um número" })
    .nonnegative("Salário não pode ser negativo"),
});

type SalaryValues = z.infer<typeof salarySchema>;

const THEME_OPTIONS: {
  value: Theme | "system";
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function SettingsPage() {
  const { user, logout } = useAuth();
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useTheme();

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const salaryForm = useForm<SalaryValues>({
    resolver: zodResolver(salarySchema),
    defaultValues: { monthly_salary: Number(user?.monthly_salary ?? 0) },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name });
      salaryForm.reset({ monthly_salary: Number(user.monthly_salary) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.monthly_salary]);

  async function saveProfile(values: ProfileValues) {
    if (values.name === user?.name) return;
    await updateProfile.mutateAsync({ name: values.name });
  }

  async function saveSalary(values: SalaryValues) {
    if (values.monthly_salary === Number(user?.monthly_salary)) return;
    await updateProfile.mutateAsync({ monthly_salary: values.monthly_salary });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Edite seu perfil, salário e preferências do app.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon className="h-4 w-4" />
                Perfil
              </CardTitle>
              <CardDescription>
                Seu nome de exibição. O email cadastrado não pode ser alterado aqui.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(saveProfile)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Nome de exibição</Label>
                  <Input id="name" autoComplete="name" {...profileForm.register("name")} />
                  {profileForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user?.email ?? ""}
                      disabled
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      updateProfile.isPending ||
                      !profileForm.formState.isDirty
                    }
                  >
                    {updateProfile.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Salvar perfil
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4" />
                Salário mensal
              </CardTitle>
              <CardDescription>
                Usado como base para a análise de risco e a projeção de saldo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={salaryForm.handleSubmit(saveSalary)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="monthly_salary">Salário (por mês)</Label>
                  <Input
                    id="monthly_salary"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    {...salaryForm.register("monthly_salary")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor atual: {formatCurrency(user?.monthly_salary ?? 0)}
                  </p>
                  {salaryForm.formState.errors.monthly_salary && (
                    <p className="text-sm text-destructive">
                      {salaryForm.formState.errors.monthly_salary.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      updateProfile.isPending ||
                      !salaryForm.formState.isDirty
                    }
                  >
                    {updateProfile.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Salvar salário
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">
                Zona de risco
              </CardTitle>
              <CardDescription>
                Faz logout neste dispositivo. Seus dados continuam salvos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aparência</CardTitle>
              <CardDescription>Escolha como o Financeiro aparece.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const isActive =
                    value === "system"
                      ? false
                      : value === theme;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        if (value === "system") {
                          const prefersDark = window.matchMedia(
                            "(prefers-color-scheme: dark)",
                          ).matches;
                          setTheme(prefersDark ? "dark" : "light");
                        } else {
                          setTheme(value);
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-md border p-3 text-xs font-medium transition-colors",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "hover:bg-accent",
                      )}
                      aria-pressed={isActive}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                "Sistema" usa a preferência atual do seu sistema operacional.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{user?.id ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conta criada em</span>
                <span>
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("pt-BR")
                    : "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
