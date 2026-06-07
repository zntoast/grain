import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage, WorkspacePage, GroupPage, TagEditorPage, AllTagsPage } from './pages';
import { useStore } from './store';

function App() {
  useStore();

  return (
    <BrowserRouter>
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
