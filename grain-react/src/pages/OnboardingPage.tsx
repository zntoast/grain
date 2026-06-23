import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { createDataFile, getSavedDataFileHandle, readSnapshotFromFile, writeSnapshotToFile } from '../services/localDataFile';

function OnboardingPage() {
  const navigate = useNavigate();
  const { exportData, importData, setHasCompletedOnboarding } = useStore();
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleCreateNewWorkspace = async () => {
    setLoading(true);
    setSelectedOption('create');
    try {
      const snapshot = exportData();
      const fileHandle = await createDataFile();
      await writeSnapshotToFile(fileHandle, snapshot);
      setHasCompletedOnboarding(true);
      navigate('/');
    } catch (error) {
      console.error('Failed to create new workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExistingWorkspace = async () => {
    setLoading(true);
    setSelectedOption('load');
    try {
      const fileHandle = await getSavedDataFileHandle();
      if (fileHandle) {
        const data = await readSnapshotFromFile(fileHandle);
        importData(data);
        setHasCompletedOnboarding(true);
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to load existing workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemporaryUse = () => {
    setSelectedOption('temporary');
    setHasCompletedOnboarding(true);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎使用 Grain</h1>
          <p className="text-gray-600">您的 AI 绘画 Tag 管理工具</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <p className="text-gray-700 text-sm text-center mb-6">
            请选择您的工作方式
          </p>

          <button
            onClick={handleCreateNewWorkspace}
            disabled={loading}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 ${
              selectedOption === 'create'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              selectedOption === 'create' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">创建新的工作环境</h3>
              <p className="text-sm text-gray-500 mt-1">
                将默认的提示词模板保存到本地文件，数据可跨设备同步
              </p>
            </div>
          </button>

          <button
            onClick={handleLoadExistingWorkspace}
            disabled={loading}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 ${
              selectedOption === 'load'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              selectedOption === 'load' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">启用现有的工作环境</h3>
              <p className="text-sm text-gray-500 mt-1">
                从之前保存的文件中恢复您的工作数据
              </p>
            </div>
          </button>

          <button
            onClick={handleTemporaryUse}
            disabled={loading}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 ${
              selectedOption === 'temporary'
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              selectedOption === 'temporary' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">临时使用</h3>
              <p className="text-sm text-gray-500 mt-1">
                不保存数据，关闭浏览器后内容将丢失
              </p>
            </div>
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium">数据同步说明</p>
              <p className="text-blue-600 mt-1">
                创建或启用工作环境后，您的数据将自动保存到本地文件。支持 Edge/Chrome 浏览器的文件系统访问 API。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
