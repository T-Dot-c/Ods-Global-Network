import { LogOut } from "lucide-react";

type LogoutButtonProps = {
  className?: string;
};

const LogoutButton = ({ className = "" }: LogoutButtonProps) => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors ${className}`}
    >
      <LogOut className="w-4 h-4" />
      <span>Logout</span>
    </button>
  );
};

export default LogoutButton;
