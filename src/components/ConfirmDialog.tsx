interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ onConfirm, onCancel }: Props) {
  return (
    <div className="overlay">
      <div className="modal max-w-xs p-6 text-center">
        <p className="confirm-text">Biztosan törlöd ezt a tankolást?</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onCancel} className="btn-secondary">
            Mégse
          </button>
          <button onClick={onConfirm} className="btn-danger">
            Törlés
          </button>
        </div>
      </div>
    </div>
  );
}
