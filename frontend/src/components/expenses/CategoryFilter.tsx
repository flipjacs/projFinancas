import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <SelectValue placeholder="All categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
        {EXPENSE_CATEGORIES.map((category) => (
          <SelectItem
            key={category}
            value={category}
            className="capitalize"
          >
            {category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
