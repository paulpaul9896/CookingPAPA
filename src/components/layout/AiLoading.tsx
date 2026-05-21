import { useApp } from '../../contexts/AppContext';

export default function AiLoading() {
  const { isAiLoading } = useApp();
  if (!isAiLoading) return null;
  return (
    <div
      id="ai-loading"
      className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
    >
      <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-700">AI 大廚思考中...</p>
      </div>
    </div>
  );
}
