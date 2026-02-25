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

// Helper to retry dynamic imports on chunk load failure (stale cache)
const lazyRetry = (importFn: () => Promise<any>) =>
  lazy(() =>
    importFn().catch(() => {
      // Force reload on stale chunk errors
      window.location.reload();
      return new Promise(() => {}); // Never resolves — page reloads
    })
  );

// Lazily loaded - less critical pages
const StateRightsPage = lazyRetry(() => import("./pages/StateRightsPage"));
const StateRightsStatePage = lazyRetry(() => import("./pages/StateRightsStatePage"));
const StateRightsCategoryPage = lazyRetry(() => import("./pages/StateRightsCategoryPage"));
const DeadlinesPage = lazyRetry(() => import("./pages/DeadlinesPage"));
const ConsumerNewsPage = lazyRetry(() => import("./pages/ConsumerNewsPage"));
const LetterAnalyzerPage = lazyRetry(() => import("./pages/LetterAnalyzerPage"));
const ArticlesPage = lazyRetry(() => import("./pages/ArticlesPage"));
const ArticleCategoryPage = lazyRetry(() => import("./pages/ArticleCategoryPage"));
const ArticlePage = lazyRetry(() => import("./pages/ArticlePage"));
const Dashboard = lazyRetry(() => import("./pages/Dashboard"));
const LoginPage = lazyRetry(() => import("./pages/LoginPage"));
const SignupPage = lazyRetry(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazyRetry(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazyRetry(() => import("./pages/ResetPasswordPage"));
const AboutPage = lazyRetry(() => import("./pages/AboutPage"));
const ContactPage = lazyRetry(() => import("./pages/ContactPage"));
const PricingPage = lazyRetry(() => import("./pages/PricingPage"));
const HowItWorksPage = lazyRetry(() => import("./pages/HowItWorksPage"));
const FAQPage = lazyRetry(() => import("./pages/FAQPage"));
const TermsPage = lazyRetry(() => import("./pages/TermsPage"));
const PrivacyPage = lazyRetry(() => import("./pages/PrivacyPage"));
const DisclaimerPage = lazyRetry(() => import("./pages/DisclaimerPage"));
const CookiePolicyPage = lazyRetry(() => import("./pages/CookiePolicyPage"));
const PurchaseSuccessPage = lazyRetry(() => import("./pages/PurchaseSuccessPage"));
const LetterEditorPage = lazyRetry(() => import("./pages/LetterEditorPage"));
const SettingsPage = lazyRetry(() => import("./pages/SettingsPage"));
const GuidesPage = lazyRetry(() => import("./pages/GuidesPage"));
const CategoryGuidePage = lazyRetry(() => import("./pages/CategoryGuidePage"));
const SmallClaimsPage = lazyRetry(() => import("./pages/SmallClaimsPage"));
const SmallClaimsStatePage = lazyRetry(() => import("./pages/SmallClaimsStatePage"));
const SmallClaimsGeneratorPage = lazyRetry(() => import("./pages/SmallClaimsGeneratorPage"));
const SmallClaimsCostCalculatorPage = lazyRetry(() => import("./pages/SmallClaimsCostCalculatorPage"));
const SmallClaimsDemandLetterPage = lazyRetry(() => import("./pages/SmallClaimsDemandLetterPage"));
const SmallClaimsEscalationPage = lazyRetry(() => import("./pages/SmallClaimsEscalationPage"));
const CaseQuizPage = lazyRetry(() => import("./pages/CaseQuizPage"));

// Admin routes - lazy loaded
const AdminLayout = lazyRetry(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazyRetry(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazyRetry(() => import("./pages/admin/AdminOrders"));
const SEODashboard = lazyRetry(() => import("./pages/admin/SEODashboard"));
const AdminBlog = lazyRetry(() => import("./pages/admin/AdminBlog"));
const AdminBlogEditor = lazyRetry(() => import("./pages/admin/AdminBlogEditor"));
const AIBlogGenerator = lazyRetry(() => import("./pages/admin/AIBlogGenerator"));
const AdminPages = lazyRetry(() => import("./pages/admin/AdminPages"));
const AdminTemplates = lazyRetry(() => import("./pages/admin/AdminTemplates"));
const AdminPageEditor = lazyRetry(() => import("./pages/admin/AdminPageEditor"));
const AdminUsers = lazyRetry(() => import("./pages/admin/AdminUsers"));
const AdminAnalytics = lazyRetry(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazyRetry(() => import("./pages/admin/AdminSettings"));
const AdminHealth = lazyRetry(() => import("./pages/admin/AdminHealth"));

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
            <Route path="/small-claims/cost-calculator" element={<SmallClaimsCostCalculatorPage />} />
            <Route path="/small-claims/demand-letter-cost" element={<SmallClaimsDemandLetterPage />} />
            <Route path="/small-claims/escalation-guide" element={<SmallClaimsEscalationPage />} />
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
