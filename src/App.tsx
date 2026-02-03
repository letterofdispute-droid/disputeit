import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import LetterPage from "./pages/LetterPage";
import AllTemplatesPage from "./pages/AllTemplatesPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import LegacyTemplateRedirect from "./components/LegacyTemplateRedirect";
import LegacyCategoryRedirect from "./components/LegacyCategoryRedirect";
import NotFound from "./pages/NotFound";
import ArticlesPage from "./pages/ArticlesPage";
import ArticleCategoryPage from "./pages/ArticleCategoryPage";
import ArticlePage from "./pages/ArticlePage";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PricingPage from "./pages/PricingPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import FAQPage from "./pages/FAQPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import DisclaimerPage from "./pages/DisclaimerPage";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminBlogEditor from "./pages/admin/AdminBlogEditor";
import AdminPages from "./pages/admin/AdminPages";
import AdminPageEditor from "./pages/admin/AdminPageEditor";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* New hierarchical template routes */}
          <Route path="/templates" element={<AllTemplatesPage />} />
          <Route path="/templates/:categoryId" element={<CategoryPage />} />
          <Route path="/templates/:categoryId/:subcategorySlug" element={<SubcategoryPage />} />
          <Route path="/templates/:categoryId/:subcategorySlug/:templateSlug" element={<LetterPage />} />
          
          {/* Legacy routes with redirects for SEO */}
          <Route path="/category/:categoryId" element={<LegacyCategoryRedirect />} />
          <Route path="/complaint-letter/:slug" element={<LegacyTemplateRedirect />} />
          
          {/* Blog Routes */}
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:category" element={<ArticleCategoryPage />} />
          <Route path="/articles/:category/:slug" element={<ArticlePage />} />
          
          {/* Static Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/purchase-success" element={<PurchaseSuccessPage />} />
          
          {/* Auth & Dashboard */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="blog/new" element={<AdminBlogEditor />} />
            <Route path="blog/edit/:id" element={<AdminBlogEditor />} />
            <Route path="pages" element={<AdminPages />} />
            <Route path="pages/new" element={<AdminPageEditor />} />
            <Route path="pages/edit/:id" element={<AdminPageEditor />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
