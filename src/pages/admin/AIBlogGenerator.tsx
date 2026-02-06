import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Sparkles, FileText, Send } from 'lucide-react';
import { TONE_OPTIONS, type ToneValue } from '@/config/blogTones';
import { useGenerateBlogContent } from '@/hooks/useGenerateBlogContent';
import { useCreateDraftFromGenerated } from '@/hooks/useCreateDraftFromGenerated';
import { ContentPreview } from '@/components/admin/blog/ContentPreview';
import { SEOScorePanel } from '@/components/admin/blog/SEOScorePanel';
import { FeaturedImagePicker } from '@/components/admin/blog/FeaturedImagePicker';
import type { SuggestedImage } from '@/hooks/useImageSuggestions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AIBlogGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form state
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [wordCount, setWordCount] = useState([1500]);
  const [tone, setTone] = useState<ToneValue>('expert_professional');
  
  // Generated content
  const { generate, isLoading, content, reset } = useGenerateBlogContent();
  
  // Image selection
  const [selectedImage, setSelectedImage] = useState<SuggestedImage | null>(null);
  const [isGeneratingAIImage, setIsGeneratingAIImage] = useState(false);
  
  // Draft creation
  const { createDraft, isCreating } = useCreateDraftFromGenerated();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: 'Topic required',
        description: 'Please enter a topic for the blog post',
        variant: 'destructive',
      });
      return;
    }

    await generate({
      topic,
      keywords,
      wordCount: wordCount[0],
      tone,
    });
  };

  const handleGenerateAIImage = async () => {
    if (!content) return;
    
    setIsGeneratingAIImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-image', {
        body: {
          title: content.title,
          excerpt: content.excerpt,
          style: 'professional, modern, clean',
        },
      });

      if (error) throw error;

      if (data.imageUrl) {
        // Create a pseudo-image object for the selected state
        setSelectedImage({
          url: data.imageUrl,
          thumbnail_url: data.imageUrl,
          alt_text: `${content.title} - AI generated illustration`,
          photographer: 'AI Generated',
          photographer_url: '',
          source: 'pixabay', // Placeholder
          pixabay_id: Date.now(),
          relevance_score: 100,
        });
        
        toast({
          title: 'Image generated!',
          description: 'AI image has been created for your post',
        });
      }
    } catch (err) {
      toast({
        title: 'Image generation failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAIImage(false);
    }
  };

  const handleCreateDraft = async (publish: boolean = false) => {
    if (!content) return;
    
    const result = await createDraft({
      content,
      featuredImage: selectedImage,
      publish,
    });

    if (result) {
      navigate('/admin/blog');
    }
  };

  const handleReset = () => {
    reset();
    setSelectedImage(null);
    setTopic('');
    setKeywords('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/blog')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">AI Blog Generator</h1>
          <p className="text-muted-foreground">Generate SEO-optimized content with AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Input Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Content Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topic */}
              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Textarea
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., How to dispute an unfair parking ticket in the UK"
                  rows={2}
                  disabled={isLoading}
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label htmlFor="keywords">Target Keywords</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="parking dispute, ticket appeal, council fine"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated keywords to include in the article
                </p>
              </div>

              {/* Word Count */}
              <div className="space-y-2">
                <Label>Word Count: {wordCount[0]}</Label>
                <Slider
                  value={wordCount}
                  onValueChange={setWordCount}
                  min={500}
                  max={3000}
                  step={100}
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>500</span>
                  <span>1500</span>
                  <span>3000</span>
                </div>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <Label>Writing Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as ToneValue)} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={isLoading || !topic.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>

              {content && (
                <Button variant="outline" onClick={handleReset} className="w-full">
                  Start Over
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Featured Image Picker */}
          {content && (
            <FeaturedImagePicker
              topic={topic}
              keywords={keywords}
              selectedImage={selectedImage}
              onSelect={setSelectedImage}
              onGenerateAI={handleGenerateAIImage}
              isGeneratingAI={isGeneratingAIImage}
            />
          )}

          {/* SEO Score Panel */}
          {content && (
            <SEOScorePanel content={content} keywords={keywords} />
          )}
        </div>

        {/* Right: Preview Panel */}
        <div className="space-y-6">
          {content ? (
            <>
              <ContentPreview content={content} />
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleCreateDraft(false)}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleCreateDraft(true)}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Create & Publish
                </Button>
              </div>
            </>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Enter a topic and click "Generate Content" to see your AI-generated article
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIBlogGenerator;
