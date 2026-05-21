import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function CustomModal() {
  const { customModal, dismissCustomModal } = useApp();
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    if (customModal?.type === 'prompt') {
      setInputVal(customModal.defaultValue ?? '');
    }
  }, [customModal]);

  if (!customModal) return null;

  const handleConfirm = () => {
    customModal.onConfirm(customModal.type === 'prompt' ? inputVal : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col items-center justify-center p-4 text-left">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
        <h3 className="text-lg font-bold mb-2">{customModal.title}</h3>
        <p className="text-sm text-gray-600 mb-6 whitespace-pre-line px-2">{customModal.message}</p>
        {customModal.type === 'prompt' && (
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 mb-4 text-sm"
            placeholder={customModal.placeholder || ''}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
            autoFocus
          />
        )}
        <div className="flex gap-3">
          {customModal.type !== 'alert' && (
            <button
              onClick={customModal.onCancel}
              className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-gray-600 transition hover:bg-gray-200"
            >
              取消
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-blue-500 rounded-2xl font-bold text-white shadow-lg transition hover:bg-blue-600"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
}
