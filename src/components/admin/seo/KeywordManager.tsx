import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, Zap, Trash2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useKeywordTargets } from '@/hooks/useKeywordTargets';
import * as XLSX from 'xlsx';

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
  'utilities': 'utilities',
  'travel': 'travel',
  'refunds': 'refunds',
  'damaged goods': 'damaged-goods',
  'damaged-goods': 'damaged-goods',
  'ecommerce': 'ecommerce',
  'e-commerce': 'ecommerce',
};

function normalizeSheetName(name: string): string | null {
  const lower = name.toLowerCase().trim();
  return SHEET_NAME_MAP[lower] || null;
}

export default function KeywordManager() {
  const { verticalStats, isLoading, importKeywords, isImporting, planFromKeywords, isPlanning, clearKeywords } = useKeywordTargets();
  const [parseResult, setParseResult] = useState<{ vertical: string; total: number; seeds: number }[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    const sheets: { vertical: string; keywords: { keyword: string; isSeed: boolean; columnGroup: string }[] }[] = [];
    const preview: { vertical: string; total: number; seeds: number }[] = [];

    for (const sheetName of workbook.SheetNames) {
      const vertical = normalizeSheetName(sheetName);
      if (!vertical) continue;

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (!jsonData || jsonData.length === 0) continue;

      const keywords: { keyword: string; isSeed: boolean; columnGroup: string }[] = [];
      
      // Row 0 = headers (seed keywords)
      const headerRow = jsonData[0] || [];
      const seedKeywords = headerRow
        .filter((cell: any) => cell && String(cell).trim())
        .map((cell: any) => String(cell).trim());

      // Add seed keywords
      for (const seed of seedKeywords) {
        keywords.push({ keyword: seed, isSeed: true, columnGroup: seed });
      }

      // Rows 1+ = variations under each column
      for (let rowIdx = 1; rowIdx < jsonData.length; rowIdx++) {
        const row = jsonData[rowIdx] || [];
        for (let colIdx = 0; colIdx < seedKeywords.length; colIdx++) {
          const cell = row[colIdx];
          if (cell && String(cell).trim()) {
            keywords.push({
              keyword: String(cell).trim(),
              isSeed: false,
              columnGroup: seedKeywords[colIdx],
            });
          }
        }
      }

      if (keywords.length > 0) {
        sheets.push({ vertical, keywords });
        preview.push({ vertical, total: keywords.length, seeds: seedKeywords.length });
      }
    }

    if (sheets.length === 0) {
      return;
    }

    setParseResult(preview);
    importKeywords(sheets);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
          {isPlanning && (
            <div className="space-y-2">
              <Progress value={undefined} className="h-2" />
              <p className="text-sm text-muted-foreground">
                AI is clustering keywords into pillar/cluster articles...
              </p>
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
    </div>
  );
}
