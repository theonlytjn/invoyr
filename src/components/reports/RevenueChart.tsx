"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  month: string;
  revenue: number;
}

interface Props {
  data: DataPoint[];
}

export default function RevenueChart({ data }: Props) {
  if (!data.length) {
    return <p className="text-sm text-gray-500 py-8 text-center">No revenue data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value) =>
            typeof value === "number"
              ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value)
              : String(value)
          }
          contentStyle={{ border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="revenue" fill="#111827" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
