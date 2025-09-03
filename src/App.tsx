import { AuthProvider, useAuth } from './context/AuthContext';
import { PosProvider } from './context/PosContext';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/admin/AdminDashboard';
import CajeroInterface from './components/cajero/CajeroInterface';
import MozoInterface from './components/mozo/MozoInterface';
import CocinaInterface from './components/cocina/CocinaInterface';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'cajero':
      return <CajeroInterface />;
    case 'mozo':
      return <MozoInterface />;
    case 'cocina':
      return <CocinaInterface />;
    default:
      return <LoginScreen />;
  }
}

function App() {
  return (
    <AuthProvider>
      <PosProvider>
        <div className="min-h-screen bg-gray-50">
          <AppContent />
        </div>
      </PosProvider>
    </AuthProvider>
  );
}

export default App;