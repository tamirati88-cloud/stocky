import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Market } from '../types';

export type FilterCategory = 'ALL' | 'TASE' | 'US' | 'TRIGGERED';
export type SortOption = 'DEFAULT' | 'CHANGE_DESC' | 'CHANGE_ASC' | 'NAME' | 'DISTANCE';

interface FilterToolbarProps {
  currentFilter: FilterCategory;
  onFilterChange: (cat: FilterCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCounts: {
    all: number;
    tase: number;
    us: number;
    triggered: number;
  };
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalCounts,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 mb-6 flex flex-col lg:flex-row items-center justify-between gap-3">
      {/* Category Segmented Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 border border-slate-800/80 rounded-lg w-full lg:w-auto overflow-x-auto">
        <button
          onClick={() => onFilterChange('ALL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            currentFilter === 'ALL'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>הכל</span>
          <span className="text-[11px] font-mono-numbers px-1.5 py-0.2 rounded bg-slate-700/50 text-slate-300">
            {totalCounts.all}
          </span>
        </button>

        <button
          onClick={() => onFilterChange('TASE')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            currentFilter === 'TASE'
              ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🇮🇱 ישראל (ת״א)</span>
          <span className="text-[11px] font-mono-numbers px-1.5 py-0.2 rounded bg-slate-700/50 text-slate-300">
            {totalCounts.tase}
          </span>
        </button>

        <button
          onClick={() => onFilterChange('US')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            currentFilter === 'US'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🇺🇸 ארה״ב (וול סטריט)</span>
          <span className="text-[11px] font-mono-numbers px-1.5 py-0.2 rounded bg-slate-700/50 text-slate-300">
            {totalCounts.us}
          </span>
        </button>

        <button
          onClick={() => onFilterChange('TRIGGERED')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            currentFilter === 'TRIGGERED'
              ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔔 הופעלו</span>
          <span className="text-[11px] font-mono-numbers px-1.5 py-0.2 rounded bg-slate-700/50 text-slate-300">
            {totalCounts.triggered}
          </span>
        </button>
      </div>

      {/* Search and Sort controls */}
      <div className="flex items-center gap-2.5 w-full lg:w-auto">
        {/* Search */}
        <div className="relative flex-1 sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="חיפוש מניה או סימול..."
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-3 pr-9 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/60 appearance-none pl-7 cursor-pointer"
          >
            <option value="DEFAULT">מיון: ברירת מחדל</option>
            <option value="DISTANCE">קירבה להפעלת התראה</option>
            <option value="CHANGE_DESC">עלייה יומית (מהגבוה)</option>
            <option value="CHANGE_ASC">ירידה יומית (מהנמוך)</option>
            <option value="NAME">לפי שם מניה</option>
          </select>
          <ArrowUpDown className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
