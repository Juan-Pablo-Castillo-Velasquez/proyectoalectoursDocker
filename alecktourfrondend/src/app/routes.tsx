import { createBrowserRouter } from "react-router";
import { LoginRedirect, RegisterRedirect } from "./components/AuthRedirects";
import ProtectedRoute from "./components/ProtectedRoute";
import RootLayout from "./layouts/RootLayout";
import AdminDashboard from "./pages/Admindashboard";
import Benefits from "./pages/Benefits";
import BlogComunidad from "./pages/BlogComunidad";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import Contact from "./pages/Contact";
import Corporate from "./pages/Corporate";
import FAQ from "./pages/faq";
import Home from "./pages/Home";
import HotelDetail from "./pages/HotelDetail";
import NotFound from "./pages/NotFound";
import PackageDetail from "./pages/PackageDetail";
import Personalization from "./pages/Personalization";
import PreferencesForm from "./pages/PreferencesForm";
import Profile from "./pages/Profile";
import Reservas from "./pages/Reservas";
import ResetPassword from "./pages/ResetPassword";
import SearchResults from "./pages/SearchResults";
import TravelInfo from "./pages/TravelInfo";
import VerifyEmail from "./pages/VerifyEmail";
export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { path: "/", Component: Home },
      { path: "/search", Component: SearchResults },
      { path: "/package/:id", Component: PackageDetail },
      { path: "/login", Component: LoginRedirect },
      { path: "/register", Component: RegisterRedirect },
      { path: "/blog", Component: BlogComunidad },
      { path: "/checkout/:id", Component: Checkout },
      { path: "/confirmation", Component: Confirmation },
      { path: "/benefits", Component: Benefits },
      { path: "/corporate", Component: Corporate },
      { path: "/travel-info", Component: TravelInfo },
      { path: "/hotel/:id", Component: HotelDetail },
      { path: "/verify", Component: VerifyEmail },
      { path: "/faq", Component: FAQ },
      { path: "/contact", Component: Contact },
      { path: "/reset-password", Component: ResetPassword },
      { path: "*", Component: NotFound },

      // Rutas protegidas (requieren login)
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "/personalize/:id",
        element: (
          <ProtectedRoute>
            <Personalization />
          </ProtectedRoute>
        ),
      },
      {
        path: "/reservas",
        element: (
          <ProtectedRoute>
            <Reservas />
          </ProtectedRoute>
        ),
      },
      {
        path: "/preferences",
        element: (
          <ProtectedRoute>
            <PreferencesForm />
          </ProtectedRoute>
        ),
      },

      // Ruta exclusiva admin
      {
        path: "/admin",
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
