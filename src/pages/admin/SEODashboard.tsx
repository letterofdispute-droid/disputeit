import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, ListTodo, Link2, Calendar, BarChart3, Target, Settings } from 'lucide-react';
import TemplateCoverageMap from '@/components/admin/seo/TemplateCoverageMap';
import ContentQueue from '@/components/admin/seo/ContentQueue';
import LinkSuggestions from '@/components/admin/seo/LinkSuggestions';
import ContentCalendar from '@/components/admin/seo/ContentCalendar';
import CoverageStats from '@/components/admin/seo/CoverageStats';
import ContentPerformance from '@/components/admin/seo/analytics/ContentPerformance';
import GapAnalysis from '@/components/admin/seo/analytics/GapAnalysis';
import CategoryTierSettings from '@/components/admin/seo/CategoryTierSettings';

export default function SEODashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
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
      <Tabs defaultValue="coverage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex">
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
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="settings" className="mt-4">
          <CategoryTierSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
