import { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  title?: string;
  content?: string;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

const TagInput = ({ tags, onChange, title, content }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<BlogTag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase
        .from('blog_tags')
        .select('*')
        .order('name');
      
      if (data) {
        setSuggestions(data);
      }
    };
    fetchTags();
  }, []);

  const handleAddTag = async (tagName: string) => {
    const normalizedTag = tagName.toLowerCase().trim();
    if (!normalizedTag || tags.includes(normalizedTag)) return;

    // Check if tag exists in database
    const existingTag = suggestions.find(s => s.name.toLowerCase() === normalizedTag);
    
    if (!existingTag) {
      // Create new tag in database
      const slug = normalizedTag.replace(/[^a-z0-9]+/g, '-');
      const { data } = await supabase
        .from('blog_tags')
        .insert({ name: normalizedTag, slug })
        .select()
        .single();
      
      if (data) {
        setSuggestions([...suggestions, data]);
      }
    }

    onChange([...tags, normalizedTag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
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

    setIsSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-category-tags', {
        body: {
          title,
          content,
          availableCategories: [], // Not needed for tags
        },
      });

      if (error) throw error;

      if (data.suggestedTags && data.suggestedTags.length > 0) {
        // Add new tags that don't already exist
        const newTags = data.suggestedTags.filter(
          (tag: string) => !tags.includes(tag.toLowerCase())
        );
        
        if (newTags.length > 0) {
          // Add each tag to database if needed and to the list
          for (const tag of newTags) {
            await handleAddTag(tag);
          }
          toast({
            title: 'Tags suggested',
            description: `Added ${newTags.length} tag${newTags.length > 1 ? 's' : ''}`,
          });
        } else {
          toast({
            title: 'No new tags',
            description: 'Suggested tags already exist.',
          });
        }
      }
    } catch (error) {
      console.error('Error suggesting tags:', error);
      toast({
        title: 'Suggestion failed',
        description: 'Failed to get AI tag suggestions.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const filteredSuggestions = suggestions.filter(
    s => s.name.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s.name.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Tags</CardTitle>
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
                <p>Suggest 2 tags with AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs pr-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Add a tag..."
              className="text-sm h-8"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleAddTag(inputValue)}
              disabled={!inputValue.trim()}
              className="h-8 w-8 shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-32 overflow-auto">
              {filteredSuggestions.slice(0, 5).map((suggestion) => (
                <button
                  key={suggestion.id}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddTag(suggestion.name);
                  }}
                >
                  {suggestion.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Press Enter to add. Click ✨ for AI suggestions.
        </p>
      </CardContent>
    </Card>
  );
};

export default TagInput;
