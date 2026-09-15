import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const ODS_GOLD_GRADIENT =
  "linear-gradient(135deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)";

const Navbar = () => {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <nav className="hidden md:flex bg-[#0F285B] text-white px-6 py-4 justify-between items-center relative border-b border-white/10">
      {/* Logo */}
      <div
        className="text-lg font-bold cursor-pointer tracking-tight"
        onClick={() => navigate("/")}
      >
        ODS Global Network
      </div>

      {/* Desktop Menu */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-[#0F285B] cursor-default shadow-sm"
              style={{ background: ODS_GOLD_GRADIENT }}
            >
              {getInitials(user.fullName || "U")}
            </div>
            <span className="text-sm font-medium text-white">{user.fullName}</span>
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/login");
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#BE9B49] text-xs font-semibold text-[#EDC45B] hover:bg-white/10 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-lg text-xs font-bold text-[#0F285B] shadow-sm transition-all"
            style={{ background: ODS_GOLD_GRADIENT }}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
