import { useState, useEffect } from 'react';
import { MarketingLandingPage } from './components/MarketingLandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';

type ViewState = 'landing' | 'admin' | 'login';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');

  // Simple router based on window.location path
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      if (path === '/admin') setCurrentView('admin');
      else if (path === '/login') setCurrentView('login');
      else setCurrentView('landing');
    };

    handleLocation();
    
    // Setup listener for back/forward buttons
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  // Update URL seamlessly when view changes internally
  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    const path = view === 'landing' ? '/' : `/${view}`;
    window.history.pushState({}, '', path);
  };

  return (
    <>
      {currentView === 'landing' && (
        <MarketingLandingPage onLaunchAdmin={() => navigateTo('admin')} />
      )}
      {currentView === 'login' && (
        <Login 
          onBack={() => navigateTo('landing')} 
          onSuccess={() => navigateTo('admin')} 
        />
      )}
      {currentView === 'admin' && (
        <AdminDashboard 
          onBackToLanding={() => navigateTo('landing')} 
          onNavigateToLogin={() => navigateTo('login')}
        />
      )}
    </>
  );
}

