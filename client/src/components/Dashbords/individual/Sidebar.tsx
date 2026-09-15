type SidebarProps = {
  onSelect: (section: string) => void;
};

const Sidebar = ({ onSelect }: SidebarProps) => {
  const items = [
    { label: "Dashboard", key: "dashboard" },
    { label: "My Gifts", key: "gifts" },
    { label: "🔔 Notifications", key: "notifications" },
    { label: "Payments", key: "payments" },
    { label: "⚙️ Account", key: "account" },
  ];

  return (
    <aside className="bg-green w-64 shadow-md p-6 text-white">
      <nav className="space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="block text-gold font-semibold cursor-pointer hover:underline"
            onClick={() => onSelect(item.key)}
          >
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

