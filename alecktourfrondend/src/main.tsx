import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { AuthProvider } from "./app/context/AuthContext";
import { FavoritosProvider } from "./app/context/FavoritosContext";
import { TemaProvider } from "./app/context/TemaContext";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <FavoritosProvider>
      <TemaProvider>
        <App />
      </TemaProvider>
    </FavoritosProvider>
  </AuthProvider>
);