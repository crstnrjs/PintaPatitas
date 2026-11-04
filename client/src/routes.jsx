import TiendaLayout from "./components/TiendaLayout";
import LandingPage from "./pages/landingPage";
import PedidoWizard from "./pages/pedido/PedidoWizard";
import AdminLogin from "./admin/auth/AdminLogin";
import AdminRoute from "./admin/auth/AdminRoute";
import AdminPanel from "./admin/layout/AdminPanel";
import Dashboard from "./admin/dashboard/Dashboard";
import Requests from "./admin/requests/Requests";
import RequestDetail from "./admin/requests/RequestDetail";
import AdminCatalog from "./admin/catalog/AdminCatalog";
import ContentEditor from "./admin/content/ContentEditor";
import MarketplaceSettings from "./admin/settings/MarketplaceSettings";

const routes = [
  {
    element: <TiendaLayout />,
    children: [
      { path: "/catalogo", element: <PedidoWizard /> },
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
