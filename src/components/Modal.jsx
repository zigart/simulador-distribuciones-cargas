export default function Modal({ modal, onCancel }) {
  if (!modal) return null;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" onClick={e => e.stopPropagation()}>
        <span className="modal-icon">!</span>
        <h3 id="modalTitle">{modal.title}</h3>
        <p>{modal.text}</p>
        <div className="modal-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button onClick={modal.action}>{modal.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
