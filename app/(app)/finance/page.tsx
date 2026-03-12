"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoTransactions } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { TransactionType } from "@/lib/types";
import { currency, shortDate } from "@/lib/utils";

const colors = ["#111827", "#eab308", "#0ea5e9", "#10b981", "#ef4444"];

export default function FinancePage() {
  const [transactions, setTransactions] = useState(demoTransactions);
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState<{ amount: string; type: TransactionType; category: string; date: string; description: string }>({
    amount: "",
    type: "expense",
    category: "",
    date: "",
    description: ""
  });

  const loadTransactions = async () => {
    if (!hasSupabaseEnv) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTransactions(data as typeof demoTransactions);
  };

  useEffect(() => {
    void loadTransactions();
  }, []);

  const filtered = useMemo(() => transactions.filter((item) => typeFilter === "all" || item.type === typeFilter), [transactions, typeFilter]);
  const income = filtered.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = filtered.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const byCategory = Object.entries(
    filtered.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.category] = (accumulator[item.category] ?? 0) + item.amount;
      return accumulator;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const addTransaction = async () => {
    if (!form.amount || !form.category || !form.date) return;

    const payload = {
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
      description: form.description || null
    };

    if (!hasSupabaseEnv) {
      setTransactions((current) => [{ id: crypto.randomUUID(), workspace_id: "demo-user", created_at: new Date().toISOString(), ...payload }, ...current]);
      setForm({ amount: "", type: "expense", category: "", date: "", description: "" });
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("transactions").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }

    await loadTransactions();
    setForm({ amount: "", type: "expense", category: "", date: "", description: "" });
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-sm text-muted-foreground">Monthly income and expenses split by category.</p>
        <h1 className="text-3xl font-semibold">Finance</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Income</CardDescription>
            <CardTitle className="text-3xl text-emerald-500">{currency(income)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Expense</CardDescription>
            <CardTitle className="text-3xl text-rose-500">{currency(expense)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Net</CardDescription>
            <CardTitle className="text-3xl">{currency(income - expense)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Filter and inspect your cash movement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <table className="w-full text-sm">
                <thead className="bg-secondary/70 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-t border-border/70">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.category}</p>
                        <p className="text-muted-foreground">{item.description ?? "No note"}</p>
                      </td>
                      <td className="px-4 py-3"><Badge variant={item.type === "income" ? "success" : "danger"}>{item.type}</Badge></td>
                      <td className={`px-4 py-3 font-medium ${item.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>{currency(item.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{shortDate(item.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category split</CardTitle>
              <CardDescription>Where the money is flowing.</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {byCategory.map((entry, index) => (
                      <Cell key={entry.name} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add transaction</CardTitle>
              <CardDescription>Manual income and expense logging.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tx-amount">Amount</Label>
                  <Input id="tx-amount" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tx-type">Type</Label>
                  <select id="tx-type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as TransactionType }))} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Food" />
                <Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
              </div>
              <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Lunch, freelance, rent" />
              <Button type="button" className="w-full" onClick={() => void addTransaction()}>Save transaction</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
