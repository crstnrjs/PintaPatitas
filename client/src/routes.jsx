import { lazy } from "react";
import TiendaLayout from "./components/TiendaLayout";
import LandingPage from "./pages/landingPage";
import Terminos from "./pages/Terminos";
const PedidoWizard = lazy(() => import("./pages/pedido/PedidoWizard"));
const CuadrosListosPage = lazy(() => import("./pages/cuadros/CuadrosListosPage"));
const CuadroDetalle = lazy(() => import("./pages/cuadros/CuadroDetalle"));
const ResultadoPago = lazy(() => import("./pages/ResultadoPago"));
const NoEncontrada = lazy(() => import("./pages/NoEncontrada"));
const SobreNosotros = lazy(() => import("./pages/SobreNosotros"));
const Contacto = lazy(() => import("./pages/Contacto"));
const Soporte = lazy(() => import("./pages/Soporte"));
const AdminLogin = lazy(() => import("./admin/auth/AdminLogin"));
const AdminRoute = lazy(() => import("./admin/auth/AdminRoute"));
const AdminPanel = lazy(() => import("./admin/layout/AdminPanel"));
const Dashboard = lazy(() => import("./admin/dashboard/Dashboard"));
const Requests = lazy(() => import("./admin/requests/Requests"));
const RequestDetail = lazy(() => import("./admin/requests/RequestDetail"));
const AdminCatalog = lazy(() => import("./admin/catalog/AdminCatalog"));
const CuadrosListos = lazy(() => import("./admin/cuadros/CuadrosListos"));
const ContentEditor = lazy(() => import("./admin/content/ContentEditor"));
const MarketplaceSettings = lazy(() => import("./admin/settings/MarketplaceSettings"));

const routes = [
  {
    element: <TiendaLayout />,
    children: [
      { path: "/catalogo", element: <PedidoWizard /> },
      { path: "/terminos", element: <Terminos /> },
      { path: "/sobre-nosotros", element: <SobreNosotros /> },
      { path: "/contacto", element: <Contacto /> },
      { path: "/soporte", element: <Soporte /> },
      { path: "/cuadros-listos", element: <CuadrosListosPage /> },
      { path: "/cuadros-listos/:slug", element: <CuadroDetalle /> },
      { path: "/pago-exitoso", element: <ResultadoPago resultado="exitoso" /> },
      { path: "/pago-pendiente", element: <ResultadoPago resultado="pendiente" /> },
      { path: "/pago-fallido", element: <ResultadoPago resultado="fallido" /> },
      { path: "/", element: <LandingPage /> },
      { path: "*", element: <NoEncontrada /> },
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
      { path: "cuadros-listos", element: <CuadrosListos /> },
      { path: "contenido", element: <ContentEditor /> },
      { path: "configuracion/mercadopago", element: <MarketplaceSettings /> },
    ],
  },
];

export default routes;
