import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AppActionsContext } from '../../contexts/appActions';
import { readFlag, writeFlag } from '../../lib/storage';
import Drawer from '../ui/Drawer';
import MobileNav from './MobileNav';
import ProjectNav from './ProjectNav';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const COLLAPSED_KEY = 'collabu.sidebarCollapsed';

// These are only needed once someone opens them, so they download on first use
const NewTaskDialog = lazy(() => import('../tasks/NewTaskDialog'));
const NewProjectDialog = lazy(() => import('../projects/NewProjectDialog'));

// The frame around every signed-in page, laid out like Jira or Google Calendar:
// a sidebar on a tinted frame, and the page itself on a paper sheet.
export default function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(() => readFlag(COLLAPSED_KEY));
  const [dialog, setDialog] = useState(null); // 'task' | 'project' | 'projects'
  const [searchFocus, setSearchFocus] = useState(0); // bump to put the cursor in the search box
  const [phoneSearch, setPhoneSearch] = useState(false);
  // Once a dialog has been opened it stays mounted, so its closing animation can play
  const [loaded, setLoaded] = useState(() => new Set());
  if (dialog && !loaded.has(dialog)) setLoaded(new Set(loaded).add(dialog));

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchFocus((count) => count + 1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const actions = useMemo(() => ({
    openSearch: () => setSearchFocus((count) => count + 1),
    openNewTask: () => setDialog('task'),
    openNewProject: () => setDialog('project'),
  }), []);

  const toggleSidebar = () => {
    writeFlag(COLLAPSED_KEY, !collapsed);
    setCollapsed(!collapsed);
  };

  const closer = (name) => (open) => setDialog(open ? name : null);

  return (
    <AppActionsContext.Provider value={actions}>
      <div className="flex min-h-screen bg-paper-deep">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-card focus:bg-card focus:px-3 focus:py-2">
          Skip to content
        </a>
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} onNewProject={actions.openNewProject} />
        <div className="flex min-w-0 flex-1 flex-col md:pr-3">
          <TopBar
            searchFocus={searchFocus}
            phoneSearch={phoneSearch}
            onEndPhoneSearch={() => setPhoneSearch(false)}
            onNewTask={actions.openNewTask}
            onNewProject={actions.openNewProject}
          />
          <main
            id="main"
            className="flex-1 bg-paper px-4 pb-24 pt-6 md:mb-3 md:rounded-xl md:border md:border-line md:px-8 md:pb-8"
          >
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
        <MobileNav
          onProjects={() => setDialog('projects')}
          onSearch={() => { setPhoneSearch(true); actions.openSearch(); }}
        />
      </div>

      <Suspense fallback={null}>
        {loaded.has('task') && <NewTaskDialog open={dialog === 'task'} onOpenChange={closer('task')} />}
        {loaded.has('project') && <NewProjectDialog open={dialog === 'project'} onOpenChange={closer('project')} />}
      </Suspense>
      <Drawer open={dialog === 'projects'} onOpenChange={closer('projects')} title="Projects">
        <ProjectNav onNewProject={actions.openNewProject} onNavigate={() => setDialog(null)} />
      </Drawer>
    </AppActionsContext.Provider>
  );
}
