import { createBrowserRouter } from "react-router";
import { LoginRedirect, RegisterRedirect } from "./components/AuthRedirects";
import ProtectedRoute from "./components/ProtectedRoute";
import RootLayout from "./layouts/RootLayout";
import AdminDashboard from "./pages/Admindashboard";
import Benefits from "./pages/Benefits";

import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import Contact from "./pages/Contact";
import Corporate from "./pages/Corporate";
import FAQ from "./pages/faq";
import Home from "./pages/Home";
import HotelDetail from "./pages/HotelDetail";
import NotFound from "./pages/NotFound";
import PackageDetail from "./pages/PackageDetail";
import Packages from "./pages/Packages";
import Personalization from "./pages/Personalization";
import PreferencesForm from "./pages/PreferencesForm";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import SearchResults from "./pages/SearchResults";
import Testimonios from "./pages/Testimonios";
import TravelInfo from "./pages/TravelInfo";
import VerifyEmail from "./pages/VerifyEmail";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { path: "/", Component: Home },
      { path: "/search", Component: SearchResults },
      { path: "/package/:id", Component: PackageDetail },
      { path: "/packages", Component: Packages },
      { path: "/login", Component: LoginRedirect },
      { path: "/register", Component: RegisterRedirect },
      { path: "/checkout/:id", Component: Checkout },
      { path: "/confirmation", Component: Confirmation },
      { path: "/benefits", Component: Benefits },
      { path: "/corporate", Component: Corporate },
      { path: "/travel-info", Component: TravelInfo },
      { path: "/hotel/:id", Component: HotelDetail },
      { path: "/verify", Component: VerifyEmail },
      { path: "/faq", Component: FAQ },
      { path: "/contact", Component: Contact },
      { path: "/testimonios", Component: Testimonios },
      { path: "/reset-password", Component: ResetPassword },
      { path: "/terms", Component: TermsAndConditions },
      { path: "/privacy", Component: PrivacyPolicy },
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
