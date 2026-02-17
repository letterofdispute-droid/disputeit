import { useState } from 'react';
import { Save, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AutoPublishSettings from './AutoPublishSettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCategoryTierSettings, CategoryTierDefaults } from '@/hooks/useCategoryTierSettings';
import { templateCategories } from '@/data/templateCategories';
import { VALUE_TIERS, ValueTier } from '@/config/articleTypes';

export default function CategoryTierSettings() {
  const { tierSettings, isLoading, updateTierSettings, isUpdating, defaultTiers } = useCategoryTierSettings();
  const [localSettings, setLocalSettings] = useState<CategoryTierDefaults | null>(null);

  // Use local state for editing, fallback to fetched data
  const currentSettings = localSettings || tierSettings;

  const handleTierChange = (categoryId: string, tier: ValueTier) => {
    setLocalSettings(prev => ({
      ...(prev || tierSettings),
      [categoryId]: tier,
    }));
  };

  const handleSave = () => {
    if (localSettings) {
      updateTierSettings(localSettings);
      setLocalSettings(null);
    }
  };

  const handleReset = () => {
    setLocalSettings(null);
  };

  const hasChanges = localSettings !== null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Publish Settings */}
      <AutoPublishSettings />
      {/* Header with explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Category SEO Tier Defaults
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    These defaults determine how many articles are generated when you use 
                    "Plan All" on a category. Higher tiers = more article types.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Set the default content tier for each category. When you click "Plan All", 
            templates will be assigned their category's default tier automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tier explanation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(VALUE_TIERS).map(([key, tier]) => (
              <div
                key={key}
                className="p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={key === 'high' ? 'default' : 'secondary'}>
                    {tier.name}
                  </Badge>
                  <span className="text-sm font-medium">{tier.articleCount} articles</span>
                </div>
                <p className="text-xs text-muted-foreground">{tier.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category tier list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categories</CardTitle>
          <div className="flex gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleReset} disabled={isUpdating}>
                Reset
              </Button>
            )}
            <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templateCategories.map((category) => {
              const currentTier = currentSettings[category.id] || 'medium';
              const isDefault = !localSettings || localSettings[category.id] === defaultTiers[category.id];
              
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        {isDefault && !localSettings && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {VALUE_TIERS[currentTier].articleCount} articles per template
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Label htmlFor={`tier-${category.id}`} className="sr-only">
                      Tier for {category.name}
                    </Label>
                    <Select
                      value={currentTier}
                      onValueChange={(value) => handleTierChange(category.id, value as ValueTier)}
                    >
                      <SelectTrigger id={`tier-${category.id}`} className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VALUE_TIERS).map(([key, tier]) => (
                          <SelectItem key={key} value={key}>
                            {tier.name} ({tier.articleCount})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
