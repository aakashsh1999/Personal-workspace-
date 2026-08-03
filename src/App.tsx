import { Menu } from 'lucide-react';
import { useEffect } from 'react';
import { AuthControls } from './components/AuthControls';
import { AuthLoading, AuthScreen } from './components/AuthScreen';
import { PageWorkspace } from './components/PageWorkspace';
import { Sidebar } from './components/Sidebar';
import { ThemePicker } from './components/ThemePicker';
import { AuthProvider, useAuth } from './lib/auth';
import { TRACKER_ORIGIN } from './lib/apps';
import { StoreProvider, useStore } from './store';

function Shell() {
  const { state, toggleSidebar, activePage, syncStatus, setActivePageId } =
    useStore();
  const isFinance =
    activePage?.space === 'finance' || activePage?.id === 'page-finance';

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== TRACKER_ORIGIN) return;
      const data = event.data as { type?: string; pageId?: string } | null;
      if (!data || data.type !== 'orbit:navigate') return;
      setActivePageId(data.pageId || 'page-home');
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [setActivePageId]);

  return (
    <div
      className={`app ${state.sidebarCollapsed ? 'sidebar-is-collapsed' : ''} ${isFinance ? 'app--finance' : ''}`}
    >
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
        <main
          className={`main-scroll ${isFinance ? 'main-scroll--flush' : ''}`}
          id="main-content"
        >
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
