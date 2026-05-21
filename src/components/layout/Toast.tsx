import { useApp } from '../../contexts/AppContext';

export default function Toast() {
  const { toastMessage } = useApp();
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: toastMessage
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(-20px)',
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: 600,
        zIndex: 9999,
        opacity: toastMessage ? 1 : 0,
        transition: 'all 0.3s ease',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      }}
    >
      {toastMessage}
    </div>
  );
}
