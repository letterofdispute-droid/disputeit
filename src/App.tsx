import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import TrailingSlashRedirect from "@/components/TrailingSlashRedirect";
import AuthRedirectHandler from './components/auth/AuthRedirectHandler';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PageLoader } from './components/ui/loading-spinner';
import { CookieConsentProvider } from './hooks/useCookieConsent';
import CookieBanner from './components/cookie/CookieBanner';

// Eagerly loaded - critical path pages
import Index from "./pages/Index";
import CategoryPage from "./pages/CategoryPage";
import LetterPage from "./pages/LetterPage";
import AllTemplatesPage from "./pages/AllTemplatesPage";
import SubcategoryPage from "./pages/SubcategoryPage";
import LegacyTemplateRedirect from "./components/LegacyTemplateRedirect";
import LegacyCategoryRedirect from "./components/LegacyCategoryRedirect";
import NotFound from "./pages/NotFound";

// Lazily loaded - less critical pages
const StateRightsPage = lazy(() => import("./pages/StateRightsPage"));
const StateRightsStatePage = lazy(() => import("./pages/StateRightsStatePage"));
const StateRightsCategoryPage = lazy(() => import("./pages/StateRightsCategoryPage"));
const DeadlinesPage = lazy(() => import("./pages/DeadlinesPage"));
const ConsumerNewsPage = lazy(() => import("./pages/ConsumerNewsPage"));
const LetterAnalyzerPage = lazy(() => import("./pages/LetterAnalyzerPage"));
const ArticlesPage = lazy(() => import("./pages/ArticlesPage"));
const ArticleCategoryPage = lazy(() => import("./pages/ArticleCategoryPage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const DisclaimerPage = lazy(() => import("./pages/DisclaimerPage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const PurchaseSuccessPage = lazy(() => import("./pages/PurchaseSuccessPage"));
const LetterEditorPage = lazy(() => import("./pages/LetterEditorPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const GuidesPage = lazy(() => import("./pages/GuidesPage"));
const CategoryGuidePage = lazy(() => import("./pages/CategoryGuidePage"));
const SmallClaimsPage = lazy(() => import("./pages/SmallClaimsPage"));
const SmallClaimsStatePage = lazy(() => import("./pages/SmallClaimsStatePage"));
const SmallClaimsGeneratorPage = lazy(() => import("./pages/SmallClaimsGeneratorPage"));
const CaseQuizPage = lazy(() => import("./pages/CaseQuizPage"));

// Helper to retry dynamic imports on chunk load failure (stale cache)
const lazyRetry = (importFn: () => Promise<any>) =>
  lazy(() =>
    importFn().catch(() => {
      // Force reload on stale chunk errors
      window.location.reload();
      return new Promise(() => {}); // Never resolves — page reloads
    })
  );

// Admin routes - lazy loaded
const AdminLayout = lazyRetry(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const SEODashboard = lazy(() => import("./pages/admin/SEODashboard"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminBlogEditor = lazy(() => import("./pages/admin/AdminBlogEditor"));
const AIBlogGenerator = lazy(() => import("./pages/admin/AIBlogGenerator"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates"));
const AdminPageEditor = lazy(() => import("./pages/admin/AdminPageEditor"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminHealth = lazy(() => import("./pages/admin/AdminHealth"));

// React Query client with optimized caching defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      gcTime: 1000 * 60 * 30,   // 30 minutes - garbage collection time
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      retry: 1, // Only retry once on failure
    },
  },
});

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <CookieConsentProvider>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <TrailingSlashRedirect />
        <AuthRedirectHandler />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* New hierarchical template routes - eagerly loaded */}
            <Route path="/templates" element={<AllTemplatesPage />} />
            <Route path="/templates/:categoryId" element={<CategoryPage />} />
            <Route path="/templates/:categoryId/:subcategorySlug" element={<SubcategoryPage />} />
            <Route path="/templates/:categoryId/:subcategorySlug/:templateSlug" element={<LetterPage />} />
            
            {/* Legacy routes with redirects for SEO */}
            <Route path="/category/:categoryId" element={<LegacyCategoryRedirect />} />
            <Route path="/complaint-letter/:slug" element={<LegacyTemplateRedirect />} />
            
            {/* Blog Routes - lazy loaded */}
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/:category" element={<ArticleCategoryPage />} />
            <Route path="/articles/:category/:slug" element={<ArticlePage />} />
            
            {/* Static Pages - lazy loaded */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/guides/:categoryId" element={<CategoryGuidePage />} />
            <Route path="/state-rights" element={<StateRightsPage />} />
            <Route path="/state-rights/:stateSlug" element={<StateRightsStatePage />} />
            <Route path="/state-rights/:stateSlug/:categorySlug" element={<StateRightsCategoryPage />} />
            <Route path="/deadlines" element={<DeadlinesPage />} />
            <Route path="/consumer-news" element={<ConsumerNewsPage />} />
            <Route path="/analyze-letter" element={<LetterAnalyzerPage />} />
            <Route path="/small-claims" element={<SmallClaimsPage />} />
            <Route path="/small-claims/statement-generator" element={<SmallClaimsGeneratorPage />} />
            <Route path="/small-claims/:state" element={<SmallClaimsStatePage />} />
            <Route path="/do-i-have-a-case" element={<CaseQuizPage />} />
            <Route path="/purchase-success" element={<PurchaseSuccessPage />} />
            <Route path="/letters/:purchaseId/edit" element={<LetterEditorPage />} />
            
            {/* Auth & Dashboard - lazy loaded */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            
            {/* Admin Routes - lazy loaded */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="seo" element={<SEODashboard />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="blog/new" element={<AdminBlogEditor />} />
              <Route path="blog/generate" element={<AIBlogGenerator />} />
              <Route path="blog/edit/:id" element={<AdminBlogEditor />} />
              <Route path="pages" element={<AdminPages />} />
              <Route path="pages/new" element={<AdminPageEditor />} />
              <Route path="pages/edit/:id" element={<AdminPageEditor />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="health" element={<AdminHealth />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
    </CookieConsentProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
