import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

const TagInput = ({ tags, onChange }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<BlogTag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  const filteredSuggestions = suggestions.filter(
    s => s.name.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s.name.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Tags</CardTitle>
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
          Press Enter to add. Use AI SEO to get suggestions.
        </p>
      </CardContent>
    </Card>
  );
};

export default TagInput;
