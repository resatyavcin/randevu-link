import assert from "node:assert/strict"
import { test } from "node:test"
import { parseAmount, budgetTotals, isValidDate, entriesForMonth, removeMonthEntries, categoryActive, selectBudgetEntries, monthBreakdown, upsertBudgetEntry } from "../src/lib/budget.ts"

test("accepts Turkish decimal amounts and rejects invalid or ambiguous amounts", () => {
  assert.equal(parseAmount(" 123,45 "), 12345)
  assert.equal(parseAmount("0.01"), 1)
  assert.equal(parseAmount("10"), 1000)
  for (const value of ["", "0", "-1", "1.234", "1.234,56", "1e3", "NaN", "12abc"]) assert.equal(parseAmount(value), null)
})

test("totals cents exactly and permits a negative balance", () => {
  assert.deepEqual(budgetTotals([]), { income: 0, expense: 0, balance: 0 })
  assert.deepEqual(budgetTotals([{ kind: "income", amountCents: 10 }, { kind: "income", amountCents: 20 }, { kind: "expense", amountCents: 50 }]), { income: 30, expense: 50, balance: -20 })
})

test("rejects impossible calendar dates", () => {
  assert.equal(isValidDate("2024-02-29"), true)
  for (const value of ["2026-02-29", "2026-02-30", "2026-13-01", "14/11/2026", ""]) assert.equal(isValidDate(value), false)
})

const recurring = { id: "rent", kind: "expense", description: "Kira", amountCents: 100000, date: "2026-10-01", createdAt: "2026-10-01T00:00:00Z", recurrence: { endMonth: "2027-01", excludedMonths: [] } }

test("recurring entries include both endpoints but never accrue in future months", () => {
  assert.equal(entriesForMonth([recurring], "2026-09", "2027-02").length, 0)
  assert.equal(entriesForMonth([recurring], "2026-10", "2026-10").length, 1)
  assert.equal(entriesForMonth([recurring], "2026-12", "2026-11").length, 0)
  assert.equal(entriesForMonth([recurring], "2027-01", "2027-01")[0].date, "2027-01-01")
  assert.equal(entriesForMonth([recurring], "2027-02", "2027-02").length, 0)
  assert.equal(entriesForMonth([recurring], "invalid", "2027-02").length, 0)
})

test("skipped months catch up once without duplication and combine with one-off entries", () => {
  const once = { ...recurring, id: "once", kind: "income", recurrence: undefined, date: "2026-11-10", amountCents: 150000 }
  const entries = [recurring, once]
  assert.deepEqual(budgetTotals(entriesForMonth(entries, "2026-11", "2027-01")), { income: 150000, expense: 100000, balance: 50000 })
  assert.equal(entriesForMonth(entries, "2026-12", "2027-01").length, 1)
  assert.equal(entriesForMonth(entries, "2026-12", "2027-01").length, 1)
  assert.equal(entriesForMonth(entries, "2027-01", "2027-01").length, 1)
})

test("deletion protects recurring entries and deletes only selected one-off entries", () => {
  const entries = removeMonthEntries([recurring], ["rent"], "2026-11")
  const reloaded = JSON.parse(JSON.stringify(entries))
  assert.equal(entriesForMonth(reloaded, "2026-11", "2026-12").length, 1)
  assert.equal(entriesForMonth(reloaded, "2026-10", "2026-12").length, 1)
  assert.equal(entriesForMonth(reloaded, "2026-12", "2026-12").length, 1)
  assert.equal(recurring.recurrence.excludedMonths.length, 0)
  const once = { ...recurring, id: "once", recurrence: undefined }
  assert.equal(removeMonthEntries([once], ["once"], "2026-10").length, 0)
})

test("open-ended fixed entries accrue up to the current month only", () => {
  const entry = { ...recurring, recurrence: { endMonth: "", excludedMonths: [] } }
  assert.equal(entriesForMonth([entry], "2028-01", "2028-01").length, 1)
  assert.equal(entriesForMonth([entry], "2028-02", "2028-01").length, 0)
})

test("category search respects Turkish casing and amount sorting leaves source untouched", () => {
  const categories = [{ id: "office", name: "İşletme" }]
  const entries = [{ ...recurring, id: "a", description: "Kira", categoryId: "office" }, { ...recurring, id: "b", description: "Malzeme", amountCents: 200000 }]
  assert.deepEqual(selectBudgetEntries(entries, categories, "işletme", "", "date").map((entry) => entry.id), ["a"])
  assert.deepEqual(selectBudgetEntries(entries, categories, "", "", "amount").map((entry) => entry.id), ["b", "a"])
  assert.deepEqual(selectBudgetEntries(entries, categories, "malzeme", "office", "date"), [])
  assert.deepEqual(entries.map((entry) => entry.id), ["a", "b"])
})

test("savings reduce spendable funds without becoming expenses or counting fixed costs twice", () => {
  const entries = [recurring, { ...recurring, id: "income", kind: "income", recurrence: undefined, amountCents: 500000 }, { ...recurring, id: "statement", recurrence: undefined, amountCents: 50000 }]
  const math = monthBreakdown(entries, 75000)
  assert.equal(math.fixed, 100000)
  assert.equal(math.other, 50000)
  assert.equal(math.expense, 150000)
  assert.equal(math.balance, 350000)
  assert.equal(math.spendable, 325000)
  assert.equal(math.left, 275000)
  assert.equal(monthBreakdown(entries, 600000).left, -250000)
})

test("statement updates replace the same month while retaining other months and categories", () => {
  const entry = { ...recurring, id: "nov", categoryId: "card", recurrence: undefined }
  const otherMonth = { ...entry, id: "dec", date: "2026-12-01" }
  const otherCategory = { ...entry, id: "other", categoryId: "other" }
  const next = upsertBudgetEntry([entry, otherMonth, otherCategory], { ...entry, id: "replacement", amountCents: 20000 }, true)
  assert.equal(next.length, 3)
  assert.equal(next.find((item) => item.id === "replacement").amountCents, 20000)
  assert.ok(next.some((item) => item.id === "dec"))
  assert.ok(next.some((item) => item.id === "other"))
  const category = { kind: "statement", startMonth: "2026-10", endMonth: "2026-12" }
  assert.equal(categoryActive(category, "2026-10"), true)
  assert.equal(categoryActive(category, "2027-01"), false)
  assert.equal(categoryActive({ ...category, endMonth: "" }, "2027-01"), true)
})
