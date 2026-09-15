import { FcGoogle } from "react-icons/fc";
const GoogleRedirectButton = () => {
  const handleGoogleLogin = () => {
    const isDev = import.meta.env.DEV;

    const BASE_URL = isDev
      ? "http://localhost:5000"
      : "https://www.odsglobal.net";

    window.location.href = `${BASE_URL}/api/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full mt-1 p-2 bg-green text-gold rounded-full text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
    >
      <FcGoogle size={20} />
      Sign in with Google
    </button>
  );
};

export default GoogleRedirectButton;





