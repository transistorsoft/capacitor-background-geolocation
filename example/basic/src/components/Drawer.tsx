interface MenuItem {
  action: string;
  icon: string;
  label: string;
  desc: string;
  danger?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { action: 'registration',      icon: '📝', label: 'Registration',      desc: 'Update Transistor registration' },
  { action: 'permission',        icon: '🔐', label: 'Request Permission', desc: 'Request location permission' },
  { action: 'reset-odometer',    icon: '🔄', label: 'Reset Odometer',     desc: 'Reset distance counter to 0' },
  { action: 'sync',              icon: '☁️', label: 'Sync',               desc: 'Sync cached locations to server' },
  { action: 'get-state',         icon: '📊', label: 'Get State',          desc: 'View current plugin state' },
  { action: 'email-log',         icon: '📧', label: 'Email Log',          desc: 'Send debug log via email' },
  { action: 'destroy-log',       icon: '🗑️', label: 'Destroy Log',        desc: 'Clear debug log file' },
  { action: 'destroy-locations', icon: '⚠️', label: 'Destroy Locations',  desc: 'Delete all cached locations', danger: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export default function Drawer({ open, onClose, onAction }: Props) {
  return (
    <>
      <div
        className={`drawer-overlay${open ? ' open' : ''}`}
        onClick={onClose}
      />
      <div className={`drawer${open ? ' open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Actions</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {MENU_ITEMS.map(item => (
          <div
            key={item.action}
            className="menu-item"
            onClick={() => onAction(item.action)}
          >
            <span className="menu-item-icon">{item.icon}</span>
            <div>
              <div className={`menu-item-label${item.danger ? ' danger' : ''}`}>
                {item.label}
              </div>
              <div className="menu-item-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
