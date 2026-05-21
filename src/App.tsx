import { AppProvider, useApp } from './contexts/AppContext';
import Header from './components/layout/Header';
import NavBar from './components/layout/NavBar';
import Toast from './components/layout/Toast';
import AiLoading from './components/layout/AiLoading';
import CustomModal from './components/modals/CustomModal';
import CalorieRefModal from './components/modals/CalorieRefModal';
import CalorieEditModal from './components/modals/CalorieEditModal';
import ShareModal from './components/modals/ShareModal';
import PlannerModal from './components/modals/PlannerModal';
import EditRecipeModal from './components/modals/EditRecipeModal';
import HomeView from './components/views/HomeView';
import RecipeView from './components/views/RecipeView';
import FridgeView from './components/views/FridgeView';
import AddRecipeView from './components/views/AddRecipeView';
import GroceryView from './components/views/GroceryView';
import ProfileView from './components/views/ProfileView';
import CalorieView from './components/views/CalorieView';
import PlannerView from './components/views/PlannerView';

function AppShell() {
  const { currentView } = useApp();

  const viewMap: Record<string, React.ReactNode> = {
    home: <HomeView />,
    recipe: <RecipeView />,
    fridge: <FridgeView />,
    add: <AddRecipeView />,
    grocery: <GroceryView />,
    calorie: <CalorieView />,
    planner: <PlannerView />,
    profile: <ProfileView />,
  };

  return (
    <div className="text-gray-900 min-h-screen pb-24">
      <Toast />
      <AiLoading />
      <CustomModal />
      <CalorieRefModal />
      <CalorieEditModal />
      <ShareModal />
      <PlannerModal />
      <EditRecipeModal />

      <Header />

      <div className="max-w-2xl mx-auto bg-white min-h-[90vh] shadow-sm">
        <div className="view-fade">
          {viewMap[currentView] ?? <HomeView />}
        </div>
      </div>

      <NavBar />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
