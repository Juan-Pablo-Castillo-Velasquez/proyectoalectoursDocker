import { useNavigate, useSearchParams } from "react-router";
import Navbar from "../components/Navbar";
import ResetPasswordModal from "../components/ResetPasswordModal";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  return (
    <div className="min-h-screen section-tint">
      <Navbar />
      <ResetPasswordModal
        isOpen={true}
        onClose={() => navigate("/")}
        token={token}
      />
    </div>
  );
}