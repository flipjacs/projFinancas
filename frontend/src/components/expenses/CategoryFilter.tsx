import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/components/CategoryBadge";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types/expense";

export const ALL_CATEGORIES = "__all__";

interface Props {
  value: ExpenseCategory | typeof ALL_CATEGORIES;
  onChange: (value: ExpenseCategory | typeof ALL_CATEGORIES) => void;
}

export function CategoryFilter({ value, onChange }: Props) {
  return (
    <Select
      value={value}
      onValueChange={(next) =>
        onChange(next as ExpenseCategory | typeof ALL_CATEGORIES)
      }
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Todas as categorias" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_CATEGORIES}>Todas as categorias</SelectItem>
        {EXPENSE_CATEGORIES.map((category) => (
          <SelectItem key={category} value={category}>
            {CATEGORY_LABELS[category]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
