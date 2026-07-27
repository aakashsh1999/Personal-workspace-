import { Menu } from 'lucide-react';
import { AuthControls } from './components/AuthControls';
import { AuthLoading, AuthScreen } from './components/AuthScreen';
import { PageWorkspace } from './components/PageWorkspace';
import { Sidebar } from './components/Sidebar';
import { ThemePicker } from './components/ThemePicker';
import { AuthProvider, useAuth } from './lib/auth';
import { StoreProvider, useStore } from './store';

function Shell() {
  const { state, toggleSidebar, activePage, syncStatus } = useStore();

  return (
    <div className={`app ${state.sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Sidebar />
      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn mobile-menu"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="topbar-crumb">
            <span>Orbit</span>
            <span aria-hidden>/</span>
            <span>{activePage?.title ?? 'Workspace'}</span>
          </div>
          <div className="topbar-actions">
            <ThemePicker />
            <AuthControls syncStatus={syncStatus} />
          </div>
        </header>
        <main className="main-scroll" id="main-content">
          <PageWorkspace />
        </main>
      </div>
    </div>
  );
}

function AppGate() {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!user) return <AuthScreen />;

  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
