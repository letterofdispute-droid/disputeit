import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

interface HealthResponse {
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: adminProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather database stats
    const tableConfigs = [
      { name: 'profiles', description: 'User profiles' },
      { name: 'letter_purchases', description: 'Letter orders' },
      { name: 'user_letters', description: 'Saved letters' },
      { name: 'blog_posts', description: 'Blog articles' },
      { name: 'pages', description: 'Static pages' },
      { name: 'analytics_events', description: 'Analytics events' },
      { name: 'content_plans', description: 'SEO content plans' },
      { name: 'content_queue', description: 'Content queue items' },
    ];

    const tableStats: TableStats[] = [];
    let dbConnected = true;

    for (const table of tableConfigs) {
      try {
        const { count, error } = await supabaseAdmin
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error(`Error counting ${table.name}:`, error);
          tableStats.push({ name: table.name, rowCount: 0, description: table.description });
        } else {
          tableStats.push({ name: table.name, rowCount: count || 0, description: table.description });
        }
      } catch (e) {
        console.error(`Failed to query ${table.name}:`, e);
        tableStats.push({ name: table.name, rowCount: 0, description: table.description });
        dbConnected = false;
      }
    }

    const totalRows = tableStats.reduce((sum, t) => sum + t.rowCount, 0);

    // Gather storage stats
    const bucketStats: BucketStats[] = [];
    let storageConnected = true;
    let totalFiles = 0;
    let totalSize = 0;

    try {
      const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();

      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        storageConnected = false;
      } else if (buckets) {
        for (const bucket of buckets) {
          try {
            const { data: files, error: filesError } = await supabaseAdmin.storage
              .from(bucket.name)
              .list('', { limit: 1000 });

            if (filesError) {
              console.error(`Error listing files in ${bucket.name}:`, filesError);
              bucketStats.push({
                name: bucket.name,
                fileCount: 0,
                totalSize: 0,
                isPublic: bucket.public,
              });
            } else {
              // Count files and estimate size
              const fileCount = files?.filter(f => f.name && !f.name.endsWith('/')).length || 0;
              const bucketSize = files?.reduce((sum, f) => sum + (f.metadata?.size || 0), 0) || 0;
              
              bucketStats.push({
                name: bucket.name,
                fileCount,
                totalSize: bucketSize,
                isPublic: bucket.public,
              });

              totalFiles += fileCount;
              totalSize += bucketSize;
            }
          } catch (e) {
            console.error(`Failed to list files in ${bucket.name}:`, e);
            bucketStats.push({
              name: bucket.name,
              fileCount: 0,
              totalSize: 0,
              isPublic: bucket.public,
            });
          }
        }
      }
    } catch (e) {
      console.error('Storage check failed:', e);
      storageConnected = false;
    }

    // Get auth user count
    let authConnected = true;
    let totalUsers = 0;

    try {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1,
      });

      if (usersError) {
        console.error('Error listing users:', usersError);
        authConnected = false;
      } else {
        // Get total from profiles table instead for accuracy
        const { count } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        totalUsers = count || 0;
      }
    } catch (e) {
      console.error('Auth check failed:', e);
      authConnected = false;
    }

    const response: HealthResponse = {
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        tables: tableStats,
        totalRows,
      },
      storage: {
        connected: storageConnected,
        buckets: bucketStats,
        totalFiles,
        totalSize,
      },
      auth: {
        connected: authConnected,
        totalUsers,
      },
      edgeFunctions: {
        status: 'healthy', // If we got here, edge functions are working
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in system-health function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
