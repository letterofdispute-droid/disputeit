import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, HardDrive, Users, Zap, RefreshCw, Loader2, 
  CheckCircle2, XCircle, AlertCircle, Server, Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TableStats {
  name: string;
  rowCount: number;
  description: string;
}

interface BucketStats {
  name: string;
  fileCount: number;
  totalSize: number;
  isPublic: boolean;
}

interface HealthData {
  timestamp: string;
  database: {
    connected: boolean;
    tables: TableStats[];
    totalRows: number;
  };
  storage: {
    connected: boolean;
    buckets: BucketStats[];
    totalFiles: number;
    totalSize: number;
  };
  auth: {
    connected: boolean;
    totalUsers: number;
  };
  edgeFunctions: {
    status: 'healthy' | 'degraded' | 'error';
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StatusBadge = ({ status }: { status: boolean | 'healthy' | 'degraded' | 'error' }) => {
  if (status === true || status === 'healthy') {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Healthy
      </Badge>
    );
  }
  if (status === 'degraded') {
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400">
        <AlertCircle className="h-3 w-3 mr-1" />
        Degraded
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
      <XCircle className="h-3 w-3 mr-1" />
      Error
    </Badge>
  );
};

const AdminHealth = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchHealthData = async (showRefreshToast = false) => {
    if (showRefreshToast) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('system-health');

      if (error) throw error;

      setHealthData(data);

      if (showRefreshToast) {
        toast({
          title: 'Health check complete',
          description: 'System status has been refreshed.',
        });
      }
    } catch (error: any) {
      console.error('Error fetching health data:', error);
      toast({
        title: 'Health check failed',
        description: error.message || 'Could not retrieve system health data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Running health checks...</p>
        </div>
      </div>
    );
  }

  const overallStatus = healthData && 
    healthData.database.connected && 
    healthData.storage.connected && 
    healthData.auth.connected &&
    healthData.edgeFunctions.status === 'healthy';

  return (
    <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">System Health</h1>
          <p className="text-muted-foreground">Monitor your platform's infrastructure status</p>
        </div>
        <div className="flex items-center gap-3">
          {healthData && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last checked: {format(new Date(healthData.timestamp), 'HH:mm:ss')}</span>
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={() => fetchHealthData(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <Card className={`mb-6 ${overallStatus ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className={`h-6 w-6 ${overallStatus ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`} />
              <div>
                <p className="font-medium text-foreground">
                  {overallStatus ? 'All Systems Operational' : 'System Issues Detected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {overallStatus 
                    ? 'All services are running normally' 
                    : 'One or more services may be experiencing issues'}
                </p>
              </div>
            </div>
            <StatusBadge status={overallStatus || false} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Database Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">Database</CardTitle>
              </div>
              <StatusBadge status={healthData?.database.connected || false} />
            </div>
            <CardDescription>
              {healthData?.database.totalRows.toLocaleString() || 0} total rows across all tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData?.database.tables.map((table) => (
                <div key={table.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {table.name.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">{table.description}</p>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {table.rowCount.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Storage Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">Storage</CardTitle>
              </div>
              <StatusBadge status={healthData?.storage.connected || false} />
            </div>
            <CardDescription>
              {healthData?.storage.totalFiles.toLocaleString() || 0} files • {formatBytes(healthData?.storage.totalSize || 0)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthData?.storage.buckets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No storage buckets configured</p>
            ) : (
              <div className="space-y-4">
                {healthData?.storage.buckets.map((bucket) => (
                  <div key={bucket.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{bucket.name}</span>
                        <Badge variant={bucket.isPublic ? 'default' : 'secondary'} className="text-xs">
                          {bucket.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {bucket.fileCount} files
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min((bucket.totalSize / (100 * 1024 * 1024)) * 100, 100)} className="h-2" />
                      <span className="text-xs text-muted-foreground w-20 text-right">
                        {formatBytes(bucket.totalSize)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auth Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">Authentication</CardTitle>
              </div>
              <StatusBadge status={healthData?.auth.connected || false} />
            </div>
            <CardDescription>User authentication service status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold text-foreground">
                  {healthData?.auth.totalUsers.toLocaleString() || 0}
                </p>
                <p className="text-sm text-muted-foreground">Registered Users</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Auth Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edge Functions Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">Backend Functions</CardTitle>
              </div>
              <StatusBadge status={healthData?.edgeFunctions.status || 'error'} />
            </div>
            <CardDescription>Serverless function execution status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'export-data', description: 'Data export functionality' },
                { name: 'generate-legal-letter', description: 'Letter generation' },
                { name: 'create-letter-checkout', description: 'Payment processing' },
                { name: 'send-purchase-email', description: 'Email delivery' },
                { name: 'system-health', description: 'Health monitoring' },
              ].map((fn) => (
                <div key={fn.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{fn.name}</p>
                    <p className="text-xs text-muted-foreground">{fn.description}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Quick Actions</CardTitle>
          <CardDescription>Common maintenance tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => fetchHealthData(true)} disabled={isRefreshing}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Full Health Check
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/settings">
                <Database className="h-4 w-4 mr-2" />
                Export Data Backup
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/analytics">
                <Zap className="h-4 w-4 mr-2" />
                View Analytics
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHealth;
