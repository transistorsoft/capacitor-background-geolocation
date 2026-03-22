import { useState } from 'react';

interface Props {
  savedEmail?: string;
  onClose: () => void;
  onSend: (email: string) => void;
}

export default function EmailDialog({ savedEmail = '', onClose, onSend }: Props) {
  const [email, setEmail] = useState(savedEmail);

  const handleSend = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    onSend(trimmed);
  };

  return (
    <div className="dialog-overlay open">
      <div className="dialog">
        <h3>Email Log</h3>
        <p>Enter an email address to receive the debug log.</p>
        <input
          className="form-input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <div className="dialog-btns">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-send" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
