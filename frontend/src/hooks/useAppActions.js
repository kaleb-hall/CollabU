import { useContext } from 'react';
import { AppActionsContext } from '../contexts/appActions';

export function useAppActions() {
  const actions = useContext(AppActionsContext);
  if (!actions) throw new Error('useAppActions must be used inside AppShell');
  return actions;
}
