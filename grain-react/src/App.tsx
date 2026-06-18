import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CursorEffects, SyncToast } from './components';
import { HomePage, WorkspacePage, GroupPage, TagEditorPage, AllTagsPage } from './pages';

function App() {
  return (
    <BrowserRouter>
      <CursorEffects />
      <SyncToast />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/workspace/:workspaceId" element={<WorkspacePage />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="/tag/:tagId" element={<TagEditorPage />} />
        <Route path="/tags" element={<AllTagsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
