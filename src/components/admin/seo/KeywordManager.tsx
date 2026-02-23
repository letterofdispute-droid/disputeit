import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, Loader2, Zap, Trash2, BarChart3, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useKeywordTargets } from '@/hooks/useKeywordTargets';
import { formatDistanceToNow } from 'date-fns';
import ExcelJS from 'exceljs';

// Known verticals for the dropdown
const KNOWN_VERTICALS = [
  'insurance', 'healthcare', 'employment', 'financial', 'housing', 'hoa',
  'contractors', 'vehicle', 'utilities', 'travel', 'refunds', 'damaged-goods',
  'ecommerce', 'consumer-rights',
];

// Map sheet names to vertical IDs
const SHEET_NAME_MAP: Record<string, string> = {
  'insurance': 'insurance',
  'healthcare': 'healthcare',
  'employment': 'employment',
  'financial': 'financial',
  'housing': 'housing',
  'hoa': 'hoa',
  'contractors': 'contractors',
  'vehicle': 'vehicle',
  'vehicleandauto': 'vehicle',
  'utilities': 'utilities',
  'travel': 'travel',
  'refunds': 'refunds',
  'damaged goods': 'damaged-goods',
  'damaged-goods': 'damaged-goods',
  'damagedgoods': 'damaged-goods',
  'ecommerce': 'ecommerce',
  'e-commerce': 'ecommerce',
  'consumerrights': 'consumer-rights',
  'consumer-rights': 'consumer-rights',
  'consumer rights': 'consumer-rights',
};

function normalizeSheetName(name: string): string | null {
  const lower = name.toLowerCase().trim();
  return SHEET_NAME_MAP[lower] || null;
}

interface ParsedSheet {
  sheetName: string;
  vertical: string;
  customVertical: string;
  keywords: { keyword: string; isSeed: boolean; columnGroup: string }[];
  total: number;
  seeds: number;
}

export default function KeywordManager() {
  const { verticalStats, isLoading, importKeywords, isImporting, planFromKeywords, isPlanning, clearKeywords, planningJob } = useKeywordTargets();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Vertical assignment dialog state
  const [parsedSheets, setParsedSheets] = useState<ParsedSheet[] | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(data);

    const sheets: ParsedSheet[] = [];

    workbook.eachSheet((worksheet) => {
      const sheetName = worksheet.name;
      const detectedVertical = normalizeSheetName(sheetName);

      const jsonData: any[][] = [];
      worksheet.eachRow({ includeEmpty: false }, (row) => {
        const rowValues = row.values as any[];
        jsonData.push(rowValues.slice(1));
      });

      if (!jsonData || jsonData.length === 0) return;

      const keywords: { keyword: string; isSeed: boolean; columnGroup: string }[] = [];
      const headerRow = jsonData[0] || [];
      const seedKeywords = headerRow
        .filter((cell: any) => cell != null && String(cell).trim())
        .map((cell: any) => String(cell).trim());

      for (const seed of seedKeywords) {
        keywords.push({ keyword: seed, isSeed: true, columnGroup: seed });
      }

      for (let rowIdx = 1; rowIdx < jsonData.length; rowIdx++) {
        const row = jsonData[rowIdx] || [];
        for (let colIdx = 0; colIdx < seedKeywords.length; colIdx++) {
          const cell = row[colIdx];
          if (cell != null && String(cell).trim()) {
            keywords.push({
              keyword: String(cell).trim(),
              isSeed: false,
              columnGroup: seedKeywords[colIdx],
            });
          }
        }
      }

      if (keywords.length > 0) {
        sheets.push({
          sheetName,
          vertical: detectedVertical || '',
          customVertical: '',
          keywords,
          total: keywords.length,
          seeds: seedKeywords.length,
        });
      }
    });

    if (sheets.length === 0) return;

    // If all sheets have auto-detected verticals, show mapping for confirmation
    setParsedSheets(sheets);
    setShowMappingDialog(true);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateSheetVertical = useCallback((index: number, vertical: string) => {
    setParsedSheets(prev => {
      if (!prev) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], vertical, customVertical: '' };
      return updated;
    });
  }, []);

  const updateSheetCustomVertical = useCallback((index: number, customVertical: string) => {
    setParsedSheets(prev => {
      if (!prev) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], vertical: 'custom', customVertical };
      return updated;
    });
  }, []);

  const handleConfirmImport = () => {
    if (!parsedSheets) return;

    const validSheets = parsedSheets
      .filter(s => {
        const v = s.vertical === 'custom' ? s.customVertical.trim().toLowerCase().replace(/\s+/g, '-') : s.vertical;
        return v && v.length > 0;
      })
      .map(s => ({
        vertical: s.vertical === 'custom' ? s.customVertical.trim().toLowerCase().replace(/\s+/g, '-') : s.vertical,
        keywords: s.keywords,
      }));

    if (validSheets.length === 0) return;

    importKeywords(validSheets);
    setShowMappingDialog(false);
    setParsedSheets(null);
  };

  const allMapped = parsedSheets?.every(s => {
    if (s.vertical === 'custom') return s.customVertical.trim().length > 0;
    return s.vertical.length > 0;
  }) ?? false;

  const totalKeywords = verticalStats?.reduce((sum, v) => sum + v.total, 0) || 0;
  const totalUnused = verticalStats?.reduce((sum, v) => sum + v.unused, 0) || 0;
  const totalSeeds = verticalStats?.reduce((sum, v) => sum + v.seeds, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Upload + Plan Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Keyword Targets
          </CardTitle>
          <CardDescription>
            Upload your SEMrush keyword data (XLSX) to drive article planning with real search terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          {totalKeywords > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <div className="text-2xl font-bold">{totalKeywords}</div>
                <div className="text-xs text-muted-foreground">Total Keywords</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <div className="text-2xl font-bold">{totalSeeds}</div>
                <div className="text-xs text-muted-foreground">Seed Keywords</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <div className="text-2xl font-bold text-primary">{totalUnused}</div>
                <div className="text-xs text-muted-foreground">Unused</div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <div className="text-2xl font-bold">{verticalStats?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Verticals</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" />Upload XLSX</>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />

            {totalUnused > 0 && (
              <Button
                onClick={() => planFromKeywords({ allVerticals: true })}
                disabled={isPlanning}
              >
                {isPlanning ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Planning...</>
                ) : (
                  <><Zap className="h-4 w-4 mr-2" />Plan All Keywords</>
                )}
              </Button>
            )}
          </div>

          {/* Planning progress */}
          {planningJob && (planningJob.status === 'processing' || planningJob.status === 'completed' || planningJob.status === 'failed') && (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {planningJob.status === 'processing' 
                    ? `Planning Keywords (${planningJob.completed_verticals.length + planningJob.failed_verticals.length} / ${planningJob.verticals.length} verticals)`
                    : planningJob.status === 'completed'
                    ? `Planning Complete — ${planningJob.total_planned} articles planned`
                    : 'Planning Failed'}
                </span>
                {planningJob.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <Progress 
                value={planningJob.verticals.length > 0 
                  ? ((planningJob.completed_verticals.length + planningJob.failed_verticals.length) / planningJob.verticals.length) * 100 
                  : 0} 
                className="h-2" 
              />
              {planningJob.status === 'processing' && planningJob.verticals[planningJob.current_vertical_index] && (
                <p className="text-sm text-muted-foreground">
                  Currently processing: <span className="font-medium capitalize">{planningJob.verticals[planningJob.current_vertical_index]}</span>
                </p>
              )}
              {planningJob.total_planned > 0 && (
                <p className="text-sm text-muted-foreground">Articles planned so far: <span className="font-medium">{planningJob.total_planned}</span></p>
              )}
              {planningJob.completed_verticals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {planningJob.completed_verticals.map((v) => {
                    const count = (planningJob.vertical_results as Record<string, any>)?.[v]?.planned || 0;
                    return (
                      <Badge key={v} variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-300">
                        ✓ {v} {count > 0 && `(${count})`}
                      </Badge>
                    );
                  })}
                </div>
              )}
              {planningJob.failed_verticals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {planningJob.failed_verticals.map((v) => (
                    <Badge key={v} variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                      ✗ {v}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vertical breakdown */}
      {verticalStats && verticalStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Keywords by Vertical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vertical</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Seeds</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Unused</TableHead>
                  <TableHead className="text-right">Last Import</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verticalStats.map((stat) => (
                  <TableRow key={stat.vertical}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{stat.vertical}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{stat.total}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{stat.seeds}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{stat.used}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={stat.unused > 0 ? 'default' : 'secondary'}>
                        {stat.unused}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {stat.latestImportedAt ? (
                        <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(stat.latestImportedAt), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {stat.unused > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => planFromKeywords({ vertical: stat.vertical })}
                            disabled={isPlanning}
                          >
                            <Zap className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => clearKeywords(stat.vertical)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && (!verticalStats || verticalStats.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No keywords imported yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your SEMrush keyword XLSX file to start planning content from real search data.
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Keywords XLSX
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Vertical Assignment Dialog */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Map Sheets to Verticals
            </DialogTitle>
            <DialogDescription>
              Confirm or change the vertical for each sheet tab before importing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {parsedSheets?.map((sheet, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">"{sheet.sheetName}"</p>
                  <p className="text-xs text-muted-foreground">{sheet.total} keywords ({sheet.seeds} seeds)</p>
                </div>
                <div className="w-48">
                  <Select
                    value={sheet.vertical}
                    onValueChange={(val) => updateSheetVertical(index, val)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select vertical" />
                    </SelectTrigger>
                    <SelectContent>
                      {KNOWN_VERTICALS.map(v => (
                        <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom...</SelectItem>
                      <SelectItem value="">Skip this sheet</SelectItem>
                    </SelectContent>
                  </Select>
                  {sheet.vertical === 'custom' && (
                    <Input
                      className="mt-2 h-8 text-sm"
                      placeholder="e.g. rent-reduction"
                      value={sheet.customVertical}
                      onChange={(e) => updateSheetCustomVertical(index, e.target.value)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowMappingDialog(false); setParsedSheets(null); }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmImport} disabled={!allMapped || isImporting}>
              {isImporting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
              ) : (
                <>Import {parsedSheets?.reduce((s, sh) => s + (sh.vertical ? sh.total : 0), 0)} Keywords</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
