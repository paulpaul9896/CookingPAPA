import { Home, Refrigerator, SquarePlus, ShoppingCart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function NavBar() {
  const { currentView, navigate, userAvatar } = useApp();

  const isActive = (id: string) =>
    id === currentView || (currentView === 'recipe' && id === 'home');

  const btnClass = (id: string) =>
    `flex justify-center transition-colors h-full ${isActive(id) ? 'text-gray-900' : 'text-gray-400'}`;

  return (
    <nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-lg border-t border-gray-100 grid grid-cols-5 items-center z-50 pb-8 pt-3 max-w-2xl left-1/2 -translate-x-1/2">
      <button className={btnClass('home')} onClick={() => navigate('home')}>
        <Home className="w-6 h-6" />
      </button>
      <button className={btnClass('fridge')} onClick={() => navigate('fridge')}>
        <Refrigerator className="w-6 h-6" />
      </button>
      <button className={btnClass('add')} onClick={() => navigate('add')}>
        <SquarePlus className="w-6 h-6" />
      </button>
      <button className={btnClass('grocery')} onClick={() => navigate('grocery')}>
        <ShoppingCart className="w-6 h-6" />
      </button>
      <button
        className="flex justify-center h-full items-center"
        onClick={() => navigate('profile')}
      >
        <div className={`w-7 h-7 rounded-full border border-gray-200 overflow-hidden ring-2 transition-all ${isActive('profile') ? 'ring-black' : 'ring-transparent'}`}>
          <img src={userAvatar} className="w-full h-full object-cover" alt="avatar" />
        </div>
      </button>
    </nav>
  );
}
