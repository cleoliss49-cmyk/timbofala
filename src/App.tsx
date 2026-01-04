import { Toaster } from "@/components/ui/toaster";
import AdminPaqueraPage from "./pages/AdminPaquera";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Search from "./pages/Search";
import Explore from "./pages/Explore";
import Community from "./pages/Community";
import Events from "./pages/Events";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Notifications from "./pages/Notifications";
import Saved from "./pages/Saved";
import Post from "./pages/Post";
import Paquera from "./pages/Paquera";
import AdminAuth from "./pages/AdminAuth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Businesses from "./pages/Businesses";
import Business from "./pages/Business";
import BusinessSetup from "./pages/BusinessSetup";
import BusinessManage from "./pages/BusinessManage";
import BusinessProduct from "./pages/BusinessProduct";
import MyOrders from "./pages/MyOrders";
import BusinessPaymentSettings from "./pages/BusinessPaymentSettings";
import ConhecerPlataforma from "./pages/ConhecerPlataforma";
import ConhecerEmpresas from "./pages/ConhecerEmpresas";
import AdminCommissions from "./pages/AdminCommissions";
import TermsOfService from "./pages/TermsOfService";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:recipientId" element={<Messages />} />
              <Route path="/search" element={<Search />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/community" element={<Community />} />
              <Route path="/events" element={<Events />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/post/:postId" element={<Post />} />
              <Route path="/paquera" element={<Paquera />} />
              <Route path="/empresas" element={<Businesses />} />
              <Route path="/commerce" element={<Businesses />} />
              <Route path="/empresa/criar" element={<BusinessSetup />} />
              <Route path="/empresa/gerenciar" element={<BusinessManage />} />
              <Route path="/empresa/pagamentos" element={<BusinessPaymentSettings />} />
              <Route path="/empresa/:slug" element={<Business />} />
              <Route path="/empresa/:businessSlug/produto/:productId" element={<BusinessProduct />} />
              <Route path="/meus-pedidos" element={<MyOrders />} />
              <Route path="/conhecer" element={<ConhecerPlataforma />} />
              <Route path="/conhecer-empresas" element={<ConhecerEmpresas />} />
              <Route path="/termos" element={<TermsOfService />} />
              <Route path="/admtbo" element={<AdminAuth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/comissoes" element={<AdminCommissions />} />
              <Route path="/admin/paquera" element={<AdminPaqueraPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
