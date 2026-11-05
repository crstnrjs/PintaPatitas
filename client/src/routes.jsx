import { lazy } from "react";
import TiendaLayout from "./components/TiendaLayout";
import LandingPage from "./pages/landingPage";
import Terminos from "./pages/Terminos";
const PedidoWizard = lazy(() => import("./pages/pedido/PedidoWizard"));
const AdminLogin = lazy(() => import("./admin/auth/AdminLogin"));
const AdminRoute = lazy(() => import("./admin/auth/AdminRoute"));
const AdminPanel = lazy(() => import("./admin/layout/AdminPanel"));
const Dashboard = lazy(() => import("./admin/dashboard/Dashboard"));
const Requests = lazy(() => import("./admin/requests/Requests"));
const RequestDetail = lazy(() => import("./admin/requests/RequestDetail"));
const AdminCatalog = lazy(() => import("./admin/catalog/AdminCatalog"));
const ContentEditor = lazy(() => import("./admin/content/ContentEditor"));
const MarketplaceSettings = lazy(() => import("./admin/settings/MarketplaceSettings"));

const routes = [
  {
    element: <TiendaLayout />,
    children: [
      { path: "/catalogo", element: <PedidoWizard /> },
      { path: "/terminos", element: <Terminos /> },
      { path: "/", element: <LandingPage /> },
    ],
  },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminPanel />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "solicitudes", element: <Requests /> },
      { path: "solicitudes/:id", element: <RequestDetail /> },
      { path: "catalogo", element: <AdminCatalog /> },
      { path: "contenido", element: <ContentEditor /> },
      { path: "configuracion/mercadopago", element: <MarketplaceSettings /> },
    ],
  },
];

export default routes;
