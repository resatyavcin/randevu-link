import type { BudgetEntry, BudgetPreferences } from "@/types/budget";
import { isValidDate, isValidMonth } from "@/lib/budget";

const STORAGE_KEY = "randevu-link.budget.v1";

export function readBudget(): BudgetEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const entries: unknown = JSON.parse(raw);
  if (
    !Array.isArray(entries) ||
    !entries.every(
      (entry) =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.description === "string" &&
        entry.description.trim() &&
        ["income", "expense"].includes(entry.kind) &&
        Number.isSafeInteger(entry.amountCents) &&
        entry.amountCents > 0 &&
        (entry.recurrence === undefined ||
          (entry.recurrence &&
            typeof entry.recurrence.endMonth === "string" &&
            (!entry.recurrence.endMonth ||
              isValidMonth(entry.recurrence.endMonth)) &&
            typeof entry.date === "string" &&
            (!entry.recurrence.endMonth ||
              entry.recurrence.endMonth >= entry.date.slice(0, 7)) &&
            Array.isArray(entry.recurrence.excludedMonths) &&
            entry.recurrence.excludedMonths.every(
              (month: unknown) =>
                typeof month === "string" && isValidMonth(month),
            ))) &&
        (entry.categoryId === undefined ||
          typeof entry.categoryId === "string") &&
        typeof entry.date === "string" &&
        isValidDate(entry.date) &&
        typeof entry.createdAt === "string" &&
        Number.isFinite(Date.parse(entry.createdAt)),
    )
  )
    throw new Error("Kayıtlar okunamadı. Mevcut verilerin üzerine yazılmadı.");
  return entries.sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function saveBudget(entries: BudgetEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const PREFERENCES_KEY = "randevu-link.budget.preferences.v1";

export function readBudgetPreferences(): BudgetPreferences {
  const raw = localStorage.getItem(PREFERENCES_KEY);
  if (!raw) return { categories: [], savings: {} };
  const value = JSON.parse(raw);
  if (
    !value ||
    !Array.isArray(value.categories) ||
    !value.categories.every(
      (category: Record<string, unknown>) =>
        category &&
        typeof category.id === "string" &&
        typeof category.name === "string" &&
        category.name.trim() &&
        ["custom", "statement"].includes(String(category.kind)) &&
        typeof category.startMonth === "string" &&
        (category.startMonth === "" || isValidMonth(category.startMonth)) &&
        typeof category.endMonth === "string" &&
        (category.endMonth === "" ||
          (isValidMonth(category.endMonth) &&
            category.endMonth >= category.startMonth)) &&
        (category.kind !== "statement" || isValidMonth(category.startMonth)),
    ) ||
    !value.savings ||
    typeof value.savings !== "object" ||
    Array.isArray(value.savings) ||
    !Object.entries(value.savings).every(
      ([month, cents]) =>
        isValidMonth(month) &&
        Number.isSafeInteger(cents) &&
        Number(cents) >= 0,
    )
  ) {
    throw new Error("Bütçe ayarları okunamadı");
  }
  return value;
}

export function saveBudgetPreferences(value: BudgetPreferences) {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value));
}
