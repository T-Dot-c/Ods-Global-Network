import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'login' | 'register'>('home');

  const handleNavigate = (view: 'home' | 'login' | 'register') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header displayed on Home page or as navigation banner */}
      {currentView === 'home' && (
        <Header currentView={currentView} onNavigate={handleNavigate} />
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentView === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {currentView === 'register' && <RegisterPage onNavigate={handleNavigate} />}
      </main>

      {/* Footer displayed on Home page */}
      {currentView === 'home' && <Footer />}
    </div>
  );
};

export default App;
