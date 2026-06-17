import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CursorEffects, SyncToast } from './components';
import { HomePage, WorkspacePage, GroupPage, TagEditorPage, AllTagsPage, OnboardingPage } from './pages';
import { useStore } from './store';

function App() {
  const store = useStore();
  const hasCompletedOnboarding = store.hasCompletedOnboarding || 
    localStorage.getItem('grain_onboarding_completed') === 'true';

  return (
    <BrowserRouter>
      <CursorEffects />
      <SyncToast />
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        {!hasCompletedOnboarding ? (
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
            <Route path="/group/:groupId" element={<GroupPage />} />
            <Route path="/tag/:tagId" element={<TagEditorPage />} />
            <Route path="/tags" element={<AllTagsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
