import { useState, useEffect } from 'react';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  content?: string;
}

const CategorySelect = ({ value, onChange, title, content }: CategorySelectProps) => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');
    
    if (data && !error) {
      setCategories(data);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data, error } = await supabase
        .from('blog_categories')
        .insert({ name: newCategoryName, slug })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCategories([...categories, data]);
        onChange(data.slug);
        setNewCategoryName('');
        setIsDialogOpen(false);
        toast({
          title: 'Category created',
          description: `"${newCategoryName}" has been added.`,
        });
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAISuggest = async () => {
    if (!title) {
      toast({
        title: 'Title required',
        description: 'Please add a title before using AI suggestion.',
        variant: 'destructive',
      });
      return;
    }

    if (categories.length === 0) {
      toast({
        title: 'No categories',
        description: 'Please create at least one category first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-category-tags', {
        body: {
          title,
          content,
          availableCategories: categories.map(c => ({ slug: c.slug, name: c.name })),
        },
      });

      if (error) throw error;

      if (data.suggestedCategory) {
        onChange(data.suggestedCategory);
        const categoryName = categories.find(c => c.slug === data.suggestedCategory)?.name;
        toast({
          title: 'Category suggested',
          description: `Set to "${categoryName}" (${data.confidence}% confidence)`,
        });
      }
    } catch (error) {
      console.error('Error suggesting category:', error);
      toast({
        title: 'Suggestion failed',
        description: 'Failed to get AI suggestion.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Category</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAISuggest}
                  disabled={isSuggesting || !title}
                  className="h-6 w-6"
                >
                  {isSuggesting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Suggest with AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                />
              </div>
              <Button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || isCreating}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Category'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CategorySelect;
