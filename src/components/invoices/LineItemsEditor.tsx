"use client";

import { TrashIcon, PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export interface LineItemRow {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

interface Props {
  items: LineItemRow[];
  currency?: string;
  onChange: (items: LineItemRow[]) => void;
}

function newRow(): LineItemRow {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, vat_rate: 20 };
}

export default function LineItemsEditor({ items, currency = "GBP", onChange }: Props) {
  function update(id: string, patch: Partial<LineItemRow>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function add() {
    onChange([...items, newRow()]);
  }

  return (
    <div className="space-y-2">
      {/* Desktop header */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_80px_100px_80px_90px_36px] gap-2 text-xs font-medium text-neutral-500 px-1">
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit price</span>
        <span className="text-right">VAT %</span>
        <span className="text-right">Line total</span>
        <span />
      </div>

      {items.map((item) => {
        const lineTotal = item.quantity * item.unit_price;
        return (
          <div key={item.id} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 sm:p-0 sm:border-0 sm:rounded-none space-y-2 sm:space-y-0 sm:grid sm:grid-cols-[1fr_80px_100px_80px_90px_36px] sm:gap-2 sm:items-center">
            <Input
              value={item.description}
              onChange={(e) => update(item.id, { description: e.target.value })}
              placeholder="Service description"
              className="h-8 text-sm"
            />
            <div className="grid grid-cols-3 gap-2 sm:contents">
              <div className="sm:contents">
                <label className="text-xs text-neutral-400 sm:hidden">Qty</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => update(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm text-right"
                />
              </div>
              <div className="sm:contents">
                <label className="text-xs text-neutral-400 sm:hidden">Price</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => update(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm text-right"
                />
              </div>
              <div className="sm:contents">
                <label className="text-xs text-neutral-400 sm:hidden">VAT %</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={item.vat_rate}
                  onChange={(e) => update(item.id, { vat_rate: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm text-right"
                />
              </div>
            </div>
            <div className="flex items-center justify-between sm:contents">
              <p className="text-sm font-medium sm:text-right sm:pr-1">
                {formatCurrency(lineTotal, currency)}
              </p>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="text-neutral-400 hover:text-red-500 transition-colors"
                disabled={items.length === 1}
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={add} className="mt-2">
        <PlusIcon size={14} className="mr-1" />
        Add line
      </Button>
    </div>
  );
}
