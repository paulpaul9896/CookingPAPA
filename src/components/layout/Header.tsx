import { Search, CalendarDays, Flame, ChevronDown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function Header() {
  const { navigate } = useApp();
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-4 py-3 flex justify-between items-center max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate('home')}>
        <h1 className="ig-title text-gray-900 select-none">Cooking PAPA</h1>
        <ChevronDown className="w-4 h-4 mt-1" />
      </div>
      <div className="flex items-center gap-5">
        <button onClick={() => navigate('search')} className="hover:text-blue-500 transition-colors">
          <Search className="w-6 h-6" />
        </button>
        <button onClick={() => navigate('planner')} className="hover:text-blue-500 transition-colors">
          <CalendarDays className="w-6 h-6" />
        </button>
        <button onClick={() => navigate('calorie')} className="hover:text-blue-500 transition-colors">
          <Flame className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
