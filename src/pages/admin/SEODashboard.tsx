import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, ListTodo, Link2, Calendar, BarChart3, Target, Settings, KeyRound, Lightbulb, LinkIcon } from 'lucide-react';
import TemplateCoverageMap from '@/components/admin/seo/TemplateCoverageMap';
import ContentQueue from '@/components/admin/seo/ContentQueue';
import LinkSuggestions from '@/components/admin/seo/LinkSuggestions';
import ContentCalendar from '@/components/admin/seo/ContentCalendar';
import CoverageStats from '@/components/admin/seo/CoverageStats';
import ContentPerformance from '@/components/admin/seo/analytics/ContentPerformance';
import GapAnalysis from '@/components/admin/seo/analytics/GapAnalysis';
import CategoryTierSettings from '@/components/admin/seo/CategoryTierSettings';
import KeywordManager from '@/components/admin/seo/KeywordManager';
import TopicDiscovery from '@/components/admin/seo/TopicDiscovery';
import BrokenLinkScanner from '@/components/admin/seo/BrokenLinkScanner';

export default function SEODashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          SEO Content Command Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Orchestrate your content strategy across 500+ templates
        </p>
      </div>

      {/* Stats Overview */}
      <CoverageStats />

      {/* Main Tabs */}
      <Tabs defaultValue="discover" className="space-y-4">
        <TabsList className="grid w-full grid-cols-10 lg:w-auto lg:inline-flex">
          <TabsTrigger value="discover" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Discover</span>
          </TabsTrigger>
          <TabsTrigger value="coverage" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Coverage</span>
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-2">
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">Queue</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Links</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="gaps" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Gaps</span>
          </TabsTrigger>
          <TabsTrigger value="keywords" className="gap-2">
            <KeyRound className="h-4 w-4" />
            <span className="hidden sm:inline">Keywords</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="broken-links" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">404s</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-4">
          <TopicDiscovery />
        </TabsContent>

        <TabsContent value="coverage" className="mt-4">
          <TemplateCoverageMap />
        </TabsContent>

        <TabsContent value="queue" className="mt-4">
          <ContentQueue />
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <LinkSuggestions />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <ContentCalendar />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <ContentPerformance />
        </TabsContent>

        <TabsContent value="gaps" className="mt-4">
          <GapAnalysis />
        </TabsContent>

        <TabsContent value="keywords" className="mt-4">
          <KeywordManager />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <CategoryTierSettings />
        </TabsContent>

        <TabsContent value="broken-links" className="mt-4">
          <BrokenLinkScanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
