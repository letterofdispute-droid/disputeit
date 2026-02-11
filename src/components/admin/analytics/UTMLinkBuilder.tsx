import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Link2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PUBLISHED_URL = 'https://disputeit.lovable.app';

const PRESET_SOURCES = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'email', label: 'Email' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'tiktok', label: 'TikTok' },
];

const PRESET_MEDIUMS = [
  { value: 'cpc', label: 'CPC (Paid Search)' },
  { value: 'ppc', label: 'PPC' },
  { value: 'social', label: 'Social' },
  { value: 'email', label: 'Email' },
  { value: 'referral', label: 'Referral' },
  { value: 'banner', label: 'Banner' },
  { value: 'affiliate', label: 'Affiliate' },
];

interface SavedLink {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

const UTMLinkBuilder = () => {
  const [landingPage, setLandingPage] = useState('/');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('utm_saved_links') || '[]');
    } catch { return []; }
  });

  const generatedUrl = useMemo(() => {
    const base = `${PUBLISHED_URL}${landingPage.startsWith('/') ? landingPage : '/' + landingPage}`;
    const params = new URLSearchParams();
    if (source) params.set('utm_source', source);
    if (medium) params.set('utm_medium', medium);
    if (campaign) params.set('utm_campaign', campaign);
    if (term) params.set('utm_term', term);
    if (content) params.set('utm_content', content);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [landingPage, source, medium, campaign, term, content]);

  const isValid = source && medium && campaign;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!isValid) return;
    const link: SavedLink = {
      id: crypto.randomUUID(),
      name: `${campaign} — ${source}/${medium}`,
      url: generatedUrl,
      createdAt: new Date().toISOString(),
    };
    const updated = [link, ...savedLinks].slice(0, 20);
    setSavedLinks(updated);
    localStorage.setItem('utm_saved_links', JSON.stringify(updated));
    toast.success('Link saved');
  };

  const handleDelete = (id: string) => {
    const updated = savedLinks.filter(l => l.id !== id);
    setSavedLinks(updated);
    localStorage.setItem('utm_saved_links', JSON.stringify(updated));
  };

  const handleCopyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success('URL copied');
  };

  const channelPreview = useMemo(() => {
    if (!medium) return null;
    const m = medium.toLowerCase();
    if (m === 'cpc' || m === 'ppc' || m === 'paid') return 'Paid Search';
    if (m === 'email') return 'Email';
    if (m === 'social') return 'Social';
    return 'Referral';
  }, [medium]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              UTM Link Builder
            </CardTitle>
            <CardDescription>
              Generate tracked URLs for marketing campaigns. These links feed into your Traffic Attribution dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="landing-page">Landing Page Path</Label>
              <Input
                id="landing-page"
                value={landingPage}
                onChange={e => setLandingPage(e.target.value)}
                placeholder="/"
              />
              <p className="text-xs text-muted-foreground">e.g. / or /housing or /letter/landlord-repair-demand</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source *</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {PRESET_SOURCES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="Or type custom source"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label>Medium *</Label>
                <Select value={medium} onValueChange={setMedium}>
                  <SelectTrigger><SelectValue placeholder="Select medium" /></SelectTrigger>
                  <SelectContent>
                    {PRESET_MEDIUMS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={medium}
                  onChange={e => setMedium(e.target.value)}
                  placeholder="Or type custom medium"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                value={campaign}
                onChange={e => setCampaign(e.target.value)}
                placeholder="e.g. spring-2026-housing"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Term <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  placeholder="Paid keyword"
                />
              </div>
              <div className="space-y-2">
                <Label>Content <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="A/B test variant"
                />
              </div>
            </div>

            {channelPreview && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-xs text-muted-foreground">Attribution channel:</span>
                <span className="text-sm font-semibold text-foreground">{channelPreview}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview & Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Generated URL</CardTitle>
            <CardDescription>Copy and use in your campaigns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border break-all font-mono text-sm text-foreground">
              {generatedUrl}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopy} disabled={!isValid} className="flex-1">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy URL'}
              </Button>
              <Button onClick={handleSave} variant="outline" disabled={!isValid}>
                <Plus className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">How it works</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>First Touch</strong>: The first UTM link a visitor clicks is stored permanently</li>
                <li>• <strong>Last Touch</strong>: The most recent UTM link before conversion is captured</li>
                <li>• Both appear in the <strong>Traffic Attribution</strong> section of the Funnel tab</li>
                <li>• Channel classification: cpc/ppc → Paid Search, email → Email, social → Social</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saved Links */}
      {savedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Saved Campaign Links</CardTitle>
            <CardDescription>Your recently created UTM links (stored locally)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedLinks.map(link => (
                <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{link.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{link.url}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" onClick={() => handleCopyLink(link.url)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(link.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UTMLinkBuilder;
