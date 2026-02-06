import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Download, Loader2, Calendar as CalendarIcon, FileSpreadsheet, Users, ShoppingCart, BarChart3, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ExportType = 'users' | 'orders' | 'analytics' | 'blog_posts';

interface ExportButtonProps {
  /** Specific export type - if provided, shows a single button instead of dropdown */
  exportType?: ExportType;
  /** Show all export options in dropdown */
  showAll?: boolean;
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Custom button text */
  label?: string;
  /** Show date range picker for certain export types */
  showDatePicker?: boolean;
}

const EXPORT_OPTIONS: Record<ExportType, { label: string; icon: React.ReactNode; description: string }> = {
  users: { 
    label: 'Users', 
    icon: <Users className="h-4 w-4" />,
    description: 'Export all user profiles with email, plan, and status'
  },
  orders: { 
    label: 'Orders', 
    icon: <ShoppingCart className="h-4 w-4" />,
    description: 'Export all purchases with payment details'
  },
  analytics: { 
    label: 'Analytics', 
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Export analytics events (max 10,000 rows)'
  },
  blog_posts: { 
    label: 'Blog Posts', 
    icon: <FileText className="h-4 w-4" />,
    description: 'Export all blog posts for backup'
  },
};

const ExportButton = ({
  exportType,
  showAll = false,
  variant = 'outline',
  size = 'default',
  label,
  showDatePicker = false,
}: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<ExportType | null>(null);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<ExportType | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  const handleExport = async (type: ExportType, withDates = false) => {
    // If date picker is needed and not provided, show dialog
    if (showDatePicker && (type === 'orders' || type === 'analytics') && !withDates) {
      setPendingExportType(type);
      setDateDialogOpen(true);
      return;
    }

    setIsExporting(true);
    setExportingType(type);

    try {
      const body: any = { type };
      
      if (withDates) {
        if (dateFrom) body.dateFrom = dateFrom.toISOString();
        if (dateTo) body.dateTo = dateTo.toISOString();
      }

      const { data, error } = await supabase.functions.invoke('export-data', {
        body,
      });

      if (error) throw error;

      // Handle the response - it should be CSV content
      if (typeof data === 'string' || data instanceof Blob) {
        const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Export complete',
          description: `${EXPORT_OPTIONS[type].label} data has been downloaded.`,
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setExportingType(null);
      setDateDialogOpen(false);
      setDateFrom(undefined);
      setDateTo(undefined);
    }
  };

  const handleDateConfirm = () => {
    if (pendingExportType) {
      handleExport(pendingExportType, true);
    }
  };

  // Single export button
  if (exportType && !showAll) {
    const option = EXPORT_OPTIONS[exportType];
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={() => handleExport(exportType)}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {label || `Export ${option.label}`}
        </Button>

        <DateRangeDialog
          open={dateDialogOpen}
          onOpenChange={setDateDialogOpen}
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          onConfirm={handleDateConfirm}
          isExporting={isExporting}
          exportType={pendingExportType}
        />
      </>
    );
  }

  // Dropdown with all options
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            {label || 'Export Data'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {Object.entries(EXPORT_OPTIONS).map(([key, option], index) => (
            <div key={key}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => handleExport(key as ExportType)}
                disabled={isExporting && exportingType === key}
                className="flex flex-col items-start gap-1 py-2"
              >
                <div className="flex items-center gap-2">
                  {isExporting && exportingType === key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    option.icon
                  )}
                  <span className="font-medium">{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground pl-6">
                  {option.description}
                </span>
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DateRangeDialog
        open={dateDialogOpen}
        onOpenChange={setDateDialogOpen}
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        onConfirm={handleDateConfirm}
        isExporting={isExporting}
        exportType={pendingExportType}
      />
    </>
  );
};

interface DateRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  setDateFrom: (date: Date | undefined) => void;
  setDateTo: (date: Date | undefined) => void;
  onConfirm: () => void;
  isExporting: boolean;
  exportType: ExportType | null;
}

const DateRangeDialog = ({
  open,
  onOpenChange,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  onConfirm,
  isExporting,
  exportType,
}: DateRangeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Date Range</DialogTitle>
          <DialogDescription>
            Choose a date range for your {exportType} export, or leave empty to export all data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportButton;
