import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const OAuthSuccessRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fullName = searchParams.get("fullName");
    const role = searchParams.get("role");
    const email = searchParams.get("email");

    if (fullName && role && email) {
      const user = { fullName, role, email };
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on role
      if (role === "admin") {
        navigate("/dashboard");
      } else if (role === "provider") {
        navigate("/provider/dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      navigate("/login");
    }
  }, [navigate, searchParams]);

  return <p className="text-center mt-20">Signing you in via Google...</p>;
};

export default OAuthSuccessRedirect;
