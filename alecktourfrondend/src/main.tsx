import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { AuthProvider } from "./app/context/AuthContext";
import { FavoritosProvider } from "./app/context/FavoritosContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <FavoritosProvider>
      <App />
    </FavoritosProvider>
  </AuthProvider>
);