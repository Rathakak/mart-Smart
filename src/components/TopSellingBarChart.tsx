import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign, Package, Trophy, Award, ShoppingCart } from 'lucide-react';
import { OrderReceipt, Product } from '../types';
import { KHR_RATE } from '../data/products';

interface TopSellingBarChartProps {
  orderHistory: OrderReceipt[];
  products: Product[];
}

interface TopSellingItem {
  productId: string;
  name: string;
  fullNameKh: string;
  fullNameEn: string;
  categoryKh: string;
  emoji: string;
  unitsSold: number;
  revenueUsd: number;
  revenueKhr: number;
}

const BAR_COLORS = [
  '#059669', // 1st - Emerald 600
  '#10b981', // 2nd - Emerald 500
  '#0d9488', // 3rd - Teal 600
  '#14b8a6', // 4th - Teal 500
  '#0284c7', // 5th - Sky 600
  '#38bdf8', // 6th - Sky 400
  '#f59e0b', // 7th - Amber 500
  '#8b5cf6', // 8th - Violet 500
];

export const TopSellingBarChart: React.FC<TopSellingBarChartProps> = ({
  orderHistory,
  products,
}) => {
  const [metric, setMetric] = useState<'units' | 'revenue'>('units');

  // Aggregate order items into product sales
  const topSellingData = useMemo(() => {
    const productSalesMap: Record<string, { unitsSold: number; revenueUsd: number; nameKh: string; nameEn: string }> = {};

    orderHistory.forEach((order) => {
      order.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            unitsSold: 0,
            revenueUsd: 0,
            nameKh: item.nameKh,
            nameEn: item.nameEn,
          };
        }
        productSalesMap[item.productId].unitsSold += item.qty;
        productSalesMap[item.productId].revenueUsd += item.subtotalUsd || item.qty * item.priceUsd;
      });
    });

    const list: TopSellingItem[] = Object.keys(productSalesMap).map((productId) => {
      const prod = products.find((p) => p.id === productId);
      const raw = productSalesMap[productId];
      const emoji = prod ? prod.emoji : '📦';
      const categoryKh = prod ? prod.categoryKh : 'ទំនិញ';

      // Clean short name for chart axis
      const cleanName = raw.nameKh.split('(')[0].trim();
      const shortName = cleanName.length > 14 ? cleanName.slice(0, 12) + '…' : cleanName;

      return {
        productId,
        name: `${emoji} ${shortName}`,
        fullNameKh: raw.nameKh,
        fullNameEn: raw.nameEn,
        categoryKh,
        emoji,
        unitsSold: raw.unitsSold,
        revenueUsd: parseFloat(raw.revenueUsd.toFixed(2)),
        revenueKhr: Math.round(raw.revenueUsd * KHR_RATE),
      };
    });

    // Sort according to metric
    if (metric === 'units') {
      return list.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 8);
    } else {
      return list.sort((a, b) => b.revenueUsd - a.revenueUsd).slice(0, 8);
    }
  }, [orderHistory, products, metric]);

  const totalUnitsAll = useMemo(() => {
    return orderHistory.reduce(
      (sum, o) => sum + o.items.reduce((iSum, it) => iSum + it.qty, 0),
      0
    );
  }, [orderHistory]);

  const totalRevenueAll = useMemo(() => {
    return orderHistory.reduce((sum, o) => sum + o.totalUsd, 0);
  }, [orderHistory]);

  if (orderHistory.length === 0 || topSellingData.length === 0) {
    return (
      <div className="py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-800">
            មិនទាន់មានទិន្នន័យលក់សម្រាប់គំនូសតាងនៅឡើយទេ
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            នៅពេលអតិថិជនទិញទំនិញ និងគិតលុយតាម POS វិក្កយបត្រនឹងត្រូវចងក្រងជាគំនូសតាងទំនិញលក់ដាច់បំផុតនៅទីនេះ។
          </p>
        </div>
      </div>
    );
  }

  const topProduct = topSellingData[0];

  return (
    <div className="space-y-4">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-emerald-800 block">
              ទំនិញលក់ដាច់លេខ ១
            </span>
            <span className="text-xs font-bold text-slate-900 truncate block">
              {topProduct?.fullNameKh || 'គ្មាន'}
            </span>
            <span className="text-[10px] text-emerald-700 font-sans font-semibold">
              {topProduct?.unitsSold} កំប៉ុង/កញ្ចប់ (${topProduct?.revenueUsd.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              បរិមាណលក់សរុប (Units)
            </span>
            <span className="text-sm font-black text-slate-900 font-sans">
              {totalUnitsAll} មុខទំនិញ
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
            <DollarSign className="w-4 h-4 font-bold" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">
              ចំណូលលក់សរុប (Revenue)
            </span>
            <span className="text-sm font-black text-emerald-700 font-sans">
              ${totalRevenueAll.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans block">
              ({Math.round(totalRevenueAll * KHR_RATE).toLocaleString()} ៛)
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Header & Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>គំនូសតាងទំនិញលក់ដាច់បំផុត (Top Selling Products)</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              ទាញយកទិន្នន័យជាក់ស្តែងពីប្រវត្តិវិក្កយបត្រដែលបានលក់ ({orderHistory.length} វិក្កយបត្រ)
            </p>
          </div>

          {/* Toggle metric */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setMetric('units')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                metric === 'units'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              តាមចំនួនលក់ (Units)
            </button>
            <button
              type="button"
              onClick={() => setMetric('revenue')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                metric === 'revenue'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              តាមចំណូល ($ Revenue)
            </button>
          </div>
        </div>

        {/* Recharts BarChart */}
        <div className="w-full h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topSellingData}
              margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={45}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => (metric === 'revenue' ? `$${val}` : `${val}`)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TopSellingItem;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 z-50">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <span className="text-base">{data.emoji}</span>
                          <span>{data.fullNameKh}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-sans">
                          {data.fullNameEn}
                        </div>
                        <div className="pt-1.5 border-t border-slate-700/80 flex justify-between gap-4">
                          <span className="text-slate-400">ចំនួនលក់បាន:</span>
                          <span className="font-bold text-amber-300 font-sans">
                            {data.unitsSold} កំប៉ុង/កញ្ចប់
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">ចំណូលទទួលបាន:</span>
                          <span className="font-bold text-emerald-400 font-sans">
                            ${data.revenueUsd.toFixed(2)} ({data.revenueKhr.toLocaleString()} ៛)
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey={metric === 'units' ? 'unitsSold' : 'revenueUsd'}
                radius={[6, 6, 0, 0]}
                animationDuration={800}
              >
                {topSellingData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.productId}`}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 5 Ranked List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>ចំណាត់ថ្នាក់ទំនិញលក់ដាច់</span>
          <span>ចំនួន & ចំណូល</span>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {topSellingData.slice(0, 5).map((item, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return (
              <div
                key={item.productId}
                className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 text-center font-bold text-sm shrink-0">
                    {medal}
                  </span>
                  <span className="text-lg p-1 bg-slate-100 rounded-lg shrink-0">
                    {item.emoji}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 truncate block">
                      {item.fullNameKh}
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans block truncate">
                      {item.fullNameEn}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 font-sans block">
                    {item.unitsSold} កំប៉ុង/កញ្ចប់
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 font-sans block">
                    ${item.revenueUsd.toFixed(2)} ({item.revenueKhr.toLocaleString()} ៛)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
