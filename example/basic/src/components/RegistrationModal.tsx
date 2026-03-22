import { useState } from 'react';

interface Props {
  savedOrg?: string;
  savedUsername?: string;
  onComplete: (org: string, username: string) => void;
}

export default function RegistrationModal({ savedOrg = '', savedUsername = '', onComplete }: Props) {
  const [org, setOrg] = useState(savedOrg);
  const [username, setUsername] = useState(savedUsername);

  const handleSubmit = () => {
    const trimmedOrg = org.trim();
    const trimmedUser = username.trim();
    if (!trimmedOrg || !trimmedUser) return;
    onComplete(trimmedOrg, trimmedUser);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="reg-overlay">
      <div className="reg-modal">
        <h2>Register Device</h2>
        <p>
          Enter your Transistor organization and a username to identify this
          device on the tracking server.
        </p>

        <label className="form-label">Organization</label>
        <input
          className="form-input"
          type="text"
          placeholder="your-org"
          autoComplete="off"
          value={org}
          onChange={e => setOrg(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <label className="form-label">Username</label>
        <input
          className="form-input"
          type="text"
          placeholder="your-name"
          autoComplete="off"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button className="submit-btn" onClick={handleSubmit}>
          Register
        </button>
      </div>
    </div>
  );
}
