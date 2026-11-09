import { useState, useEffect } from 'react';
import { MarketingLandingPage } from './components/MarketingLandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import { GymManagerPage } from './components/GymManagerPage';

type ViewState = 'landing' | 'admin' | 'login' | 'privacy' | 'gym';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');

  // Simple router based on window.location path
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      if (path === '/admin') setCurrentView('admin');
      else if (path === '/login') setCurrentView('login');
      else if (path === '/privacy') setCurrentView('privacy');
      else if (path === '/gym') setCurrentView('gym');
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
          onSuccess={(role) => navigateTo(role === 'admin' ? 'admin' : 'gym')}
        />
      )}
      {currentView === 'admin' && (
        <AdminDashboard 
          onBackToLanding={() => navigateTo('landing')} 
          onNavigateToLogin={() => navigateTo('login')}
          onNavigateToGym={() => navigateTo('gym')}
        />
      )}
      {currentView === 'gym' && (
        <GymManagerPage
          onNavigateToLogin={() => navigateTo('login')}
          onNavigateToAdmin={() => navigateTo('admin')}
        />
      )}
      {currentView === 'privacy' && (
        <PrivacyPolicyPage />
      )}
    </>
  );
}

