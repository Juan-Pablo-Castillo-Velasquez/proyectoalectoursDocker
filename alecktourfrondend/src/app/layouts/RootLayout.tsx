import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { AuthModalProvider } from "../context/AuthModalContext";
import WhatsAppButton from "../components/WhatsAppButton";

export default function RootLayout() {
    return (
        <AuthModalProvider>
            <Toaster position="top-center" richColors />
            <Outlet />
            <WhatsAppButton />
        </AuthModalProvider>
    );
}