import { useState } from 'react';
import { Check, X, ExternalLink, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LinkSuggestion } from '@/hooks/useLinkSuggestions';

interface LinkCardProps {
  suggestion: LinkSuggestion;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateAnchor: (id: string, anchor: string) => void;
}

function renderHighlightedSnippet(snippet: string, anchor: string) {
  const lowerSnippet = snippet.toLowerCase();
  const lowerAnchor = anchor.toLowerCase();
  const idx = lowerSnippet.indexOf(lowerAnchor);
  
  if (idx === -1) {
    return <span className="italic">"…{snippet}…"</span>;
  }

  const before = snippet.slice(0, idx);
  const match = snippet.slice(idx, idx + anchor.length);
  const after = snippet.slice(idx + anchor.length);

  return (
    <span className="italic">
      "…{before}<mark className="bg-primary/20 text-primary font-medium px-0.5 rounded-sm not-italic">{match}</mark>{after}…"
    </span>
  );
}

export default function LinkCard({
  suggestion,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onUpdateAnchor,
}: LinkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnchor, setEditedAnchor] = useState(suggestion.anchor_text);

  const getTargetUrl = () => {
    switch (suggestion.target_type) {
      case 'template':
        return `/templates/${suggestion.target_slug}`;
      case 'article':
        return `/articles/${suggestion.blog_posts?.category_slug || 'general'}/${suggestion.target_slug}`;
      case 'guide':
        return `/guides/${suggestion.target_slug}`;
      default:
        return `/${suggestion.target_slug}`;
    }
  };

  const handleSaveAnchor = () => {
    if (editedAnchor.trim() && editedAnchor !== suggestion.anchor_text) {
      onUpdateAnchor(suggestion.id, editedAnchor.trim());
    }
    setIsEditing(false);
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'outline';
  };

  return (
    <Card className={`overflow-hidden transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Selection Checkbox - show inline on mobile */}
          <div className="flex items-start justify-between sm:block">
            {suggestion.status === 'pending' && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(suggestion.id)}
                className="mt-1"
              />
            )}
            
            {/* Mobile: Relevance badge at top right */}
            <div className="flex sm:hidden items-center gap-2">
              <Badge variant={getRelevanceColor(suggestion.relevance_score || 0)} className="text-xs">
                {suggestion.relevance_score || 0}%
              </Badge>
              {suggestion.status !== 'pending' && (
                <Badge 
                  variant={
                    suggestion.status === 'applied' ? 'default' :
                    suggestion.status === 'approved' ? 'secondary' :
                    'outline'
                  }
                  className="capitalize text-xs"
                >
                  {suggestion.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Source Article */}
            <div className="flex items-start sm:items-center gap-2 flex-wrap">
              <Badge variant="outline" className="shrink-0 text-xs">From</Badge>
              <span className="text-sm font-medium line-clamp-2 sm:truncate">
                {suggestion.blog_posts?.title || 'Unknown article'}
              </span>
            </div>

            {/* Link Target */}
            <div className="flex items-start sm:items-center gap-2 flex-wrap">
              <Badge className="shrink-0 text-xs capitalize">{suggestion.target_type}</Badge>
              <span className="text-sm text-muted-foreground hidden sm:inline">→</span>
              <a 
                href={getTargetUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 break-all sm:truncate"
              >
                {suggestion.target_title}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>

            {/* Anchor Text */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-sm text-muted-foreground shrink-0">Anchor:</span>
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editedAnchor}
                    onChange={(e) => setEditedAnchor(e.target.value)}
                    className="h-7 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveAnchor();
                      if (e.key === 'Escape') setIsEditing(false);
                    }}
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveAnchor}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <code className="text-sm bg-muted px-2 py-0.5 rounded break-all">
                    {suggestion.anchor_text}
                  </code>
                  {suggestion.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Context Snippet with highlighted anchor */}
            {suggestion.context_snippet && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5 border border-border/50">
                <span className="font-medium text-foreground/70 mr-1">Context:</span>
                {renderHighlightedSnippet(suggestion.context_snippet, suggestion.anchor_text)}
              </div>
            )}

            {/* Mobile: Actions at bottom */}
            {suggestion.status === 'pending' && (
              <div className="flex sm:hidden items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-primary"
                  onClick={() => onApprove(suggestion.id)}
                >
                  <Check className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive"
                  onClick={() => onReject(suggestion.id)}
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>

          {/* Desktop: Relevance & Actions */}
          <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Relevance:</span>
              <Badge variant={getRelevanceColor(suggestion.relevance_score || 0)}>
                {suggestion.relevance_score || 0}%
              </Badge>
            </div>

            {suggestion.status === 'pending' && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => onApprove(suggestion.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onReject(suggestion.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {suggestion.status !== 'pending' && (
              <Badge 
                variant={
                  suggestion.status === 'applied' ? 'default' :
                  suggestion.status === 'approved' ? 'secondary' :
                  'outline'
                }
                className="capitalize"
              >
                {suggestion.status}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
