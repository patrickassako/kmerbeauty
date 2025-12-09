"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, Activity, Server, Trophy, MessageSquare, TrendingUp, ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DashboardStats = {
  totalRevenue: number;
  providerRevenue: number; // GMV
  activeClients: number;
  activeProviders: number;
  pendingProviders: number;
  recentActivityCount: number;
  openTickets: number;
  systemStatus: "operational" | "degraded" | "down";
};

type BestProvider = {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  total_revenue: number;
  booking_count: number;
};

type RecentActivity = {
  id: string;
  type: "booking" | "signup" | "ticket";
  description: string;
  created_at: string;
  status?: string;
};

type ChartData = {
  name: string;
  total: number;
};

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    providerRevenue: 0,
    activeClients: 0,
    activeProviders: 0,
    pendingProviders: 0,
    recentActivityCount: 0,
    openTickets: 0,
    systemStatus: "operational",
  });
  const [bestProvider, setBestProvider] = useState<BestProvider | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    // 1. Users Stats
    const { count: clientCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "CLIENT")
      .eq("is_active", true);

    const { count: providerCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "PROVIDER")
      .eq("is_active", true);

    const { count: pendingProviderCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "PROVIDER")
      .eq("is_verified", false);

    // 2. App Revenue (Credit Purchases)
    const { data: purchases } = await supabase
      .from("credit_purchases")
      .select("price_paid, created_at, payment_status")
      .eq("payment_status", "completed");

    const totalRevenue = purchases?.reduce((sum, p) => sum + (p.price_paid || 0), 0) || 0;

    // 3. Provider Revenue (GMV - Completed Bookings)
    const { data: completedBookings } = await supabase
      .from("bookings")
      .select("total, created_at")
      .eq("status", "COMPLETED");

    const providerRevenue = completedBookings?.reduce((sum, b) => sum + (b.total || 0), 0) || 0;

    // 4. Open Tickets
    const { count: openTickets } = await supabase
      .from("support_conversations")
      .select("*", { count: "exact", head: true })
      .eq("status", "OPEN");

    // 5. Recent Activity (Bookings in last 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { count: activityCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday.toISOString());

    // 6. Best Provider (Top Revenue)
    const { data: topProviderData, error: rpcError } = await supabase
      .rpc('get_top_provider');

    if (rpcError) {
      console.error("Error fetching best provider:", JSON.stringify(rpcError, null, 2));
    }

    const topTherapist = topProviderData?.[0];

    if (topTherapist) {
      setBestProvider({
        id: topTherapist.id,
        first_name: topTherapist.first_name || "Unknown",
        last_name: topTherapist.last_name || "Provider",
        avatar: topTherapist.avatar || null,
        total_revenue: topTherapist.total_revenue || 0,
        booking_count: topTherapist.booking_count || 0,
      });
    }

    // 7. Recent Activity Feed (Last 5 items)
    const { data: recentBookings } = await supabase
      .from("bookings")
      .select(`
        id, 
        created_at, 
        status, 
        total,
        therapist:therapists(
          user:users(first_name, last_name)
        ),
        salon:salons(name_fr)
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    const activities: RecentActivity[] = (recentBookings || []).map((b: any) => {
      let providerName = "Un prestataire";

      if (b.therapist?.user) {
        providerName = `${b.therapist.user.first_name} ${b.therapist.user.last_name}`;
      } else if (b.salon) {
        providerName = b.salon.name_fr;
      }

      return {
        id: b.id,
        type: "booking",
        description: `${providerName} a reçu une commande de ${formatCurrency(b.total)}`,
        created_at: b.created_at,
        status: b.status
      };
    });

    setRecentActivity(activities);

    setStats({
      totalRevenue,
      providerRevenue,
      activeClients: clientCount || 0,
      activeProviders: providerCount || 0,
      pendingProviders: pendingProviderCount || 0,
      recentActivityCount: activityCount || 0,
      openTickets: openTickets || 0,
      systemStatus: "operational",
    });

    // 8. Chart Data (Last 7 days revenue)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const chart = last7Days.map((date) => {
      const dayTotal = purchases
        ?.filter((p) => p.created_at.startsWith(date))
        .reduce((sum, p) => sum + (p.price_paid || 0), 0) || 0;
      return { name: date.slice(5), total: dayTotal }; // MM-DD
    });

    setChartData(chart);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CM", {
      style: "currency",
      currency: "XAF",
    }).format(amount);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vue d'ensemble de l'activité de KmerServices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={stats.systemStatus === "operational" ? "default" : "destructive"}
            className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 px-3 py-1">
            <Server className="mr-2 h-3.5 w-3.5" />
            Système Opérationnel
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 shrink-0">
        <StatsCard
          title="Revenu App"
          value={loading ? "..." : formatCurrency(stats.totalRevenue)}
          description="Ventes de crédits"
          icon={DollarSign}
          trend="+12.5%"
        />
        <StatsCard
          title="Volume d'Affaires"
          value={loading ? "..." : formatCurrency(stats.providerRevenue)}
          description="Revenus prestataires (GMV)"
          icon={Activity}
          trend="+8.2%"
        />
        <StatsCard
          title="Utilisateurs Actifs"
          value={loading ? "..." : (stats.activeClients + stats.activeProviders).toString()}
          description={`${stats.activeClients} Clients, ${stats.activeProviders} Pros`}
          icon={Users}
          trend="+24"
        />
        <StatsCard
          title="Support"
          value={loading ? "..." : stats.openTickets.toString()}
          description="Tickets ouverts"
          icon={MessageSquare}
          alert={stats.openTickets > 5}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 flex-1 min-h-0">
        {/* Revenue Chart */}
        <Card className="col-span-4 flex flex-col glass-card border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Ventes de Crédits
            </CardTitle>
            <CardDescription>Revenus sur les 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 flex-1 min-h-0">
            <div className="h-full w-full min-h-[300px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis
                      dataKey="name"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}F`}
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                      itemStyle={{ color: 'var(--foreground)' }}
                      labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}
                    />
                    <Bar
                      dataKey="total"
                      fill="var(--primary)"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Best Provider */}
        <div className="col-span-3 flex flex-col gap-6 min-h-0">
          {/* Best Provider Card */}
          <Card className="shrink-0 glass-card border-none shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy className="h-24 w-24 text-primary" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5 text-primary" />
                Meilleur Prestataire
              </CardTitle>
              <CardDescription className="text-xs">Top performance par revenu</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {loading ? (
                <div className="text-sm text-muted-foreground">Chargement...</div>
              ) : bestProvider ? (
                <div className="flex items-center gap-4 p-2 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                  <Avatar className="h-14 w-14 border-2 border-primary ring-2 ring-primary/20">
                    <AvatarImage src={bestProvider.avatar || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {bestProvider.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-lg font-bold leading-none text-foreground">
                      {bestProvider.first_name} {bestProvider.last_name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        {bestProvider.booking_count} commandes
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-lg">
                      {formatCurrency(bestProvider.total_revenue)}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenu Total</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Aucune donnée disponible</div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity List */}
          <Card className="flex-1 flex flex-col min-h-0 glass-card border-none shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Activité Récente</span>
                <Badge variant="outline" className="font-normal text-xs">Dernières 24h</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Chargement...</div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">Aucune activité récente</div>
                ) : (
                  recentActivity.map((activity, i) => (
                    <div key={activity.id} className="group flex items-start gap-3 pb-3 last:pb-0">
                      <div className="relative mt-1">
                        <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all" />
                        {i !== recentActivity.length - 1 && (
                          <div className="absolute top-3 left-1 w-[1px] h-full bg-border" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground leading-none">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {activity.status && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, description, icon: Icon, trend, alert }: {
  title: string,
  value: string,
  description: string,
  icon: any,
  trend?: string,
  alert?: boolean
}) {
  return (
    <Card className={cn(
      "glass-card border-none shadow-md transition-all duration-300 hover:-translate-y-1",
      alert && "border-l-4 border-l-destructive"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-full bg-background/50", alert ? "text-destructive" : "text-primary")}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {trend && (
            <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md mb-1">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              {trend}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
