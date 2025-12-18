"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Bug, CheckCircle, Clock, AlertCircle, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TesterSummary = {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    user_type: 'client' | 'provider';
    pending_count: number;
    working_count: number;
    broken_count: number;
    total_tests: number;
    completion_rate: number;
    last_tested_at: string;
};

type TestResult = {
    id: string;
    user_id: string;
    test_id: string;
    status: 'pending' | 'working' | 'broken';
    comment: string | null;
    device_info: string | null;
    tested_at: string;
    user_type: 'client' | 'provider';
};

type GlobalStats = {
    totalTesters: number;
    totalTests: number;
    workingTests: number;
    brokenTests: number;
    pendingTests: number;
    completionRate: number;
};

// Test names mapping for display
const TEST_NAMES: Record<string, string> = {
    // Client tests
    c_auth_signup: 'Inscription',
    c_auth_login: 'Connexion',
    c_auth_logout: 'Déconnexion',
    c_profile_view: 'Voir profil',
    c_profile_edit: 'Modifier profil',
    c_search: 'Rechercher service',
    c_categories: 'Voir catégories',
    c_service_details: 'Détails service',
    c_providers_list: 'Liste prestataires',
    c_provider_details: 'Détails prestataire',
    c_provider_salon: 'Voir institut',
    c_booking_create: 'Créer réservation',
    c_booking_list: 'Mes réservations',
    c_booking_details: 'Détails réservation',
    c_booking_cancel: 'Annuler réservation',
    c_chat_open: 'Ouvrir chat',
    c_chat_message: 'Envoyer message',
    c_chat_image: 'Envoyer image',
    c_chat_audio: 'Envoyer audio',
    c_map_view: 'Voir carte',
    c_map_location: 'Ma position',
    c_notif_receive: 'Recevoir notification',
    // Provider tests
    p_auth_signup: 'Inscription prestataire',
    p_auth_login: 'Connexion',
    p_profile_setup: 'Créer profil pro',
    p_profile_edit: 'Modifier profil',
    p_profile_photo: 'Photo profil',
    p_profile_location: 'Localisation',
    p_services_add: 'Ajouter service',
    p_services_edit: 'Modifier service',
    p_services_delete: 'Supprimer service',
    p_services_price: 'Définir prix',
    p_availability_set: 'Définir horaires',
    p_availability_break: 'Ajouter pause',
    p_bookings_view: 'Voir demandes',
    p_bookings_accept: 'Accepter demande',
    p_bookings_reject: 'Refuser demande',
    p_bookings_complete: 'Terminer RDV',
    p_dashboard_stats: 'Voir statistiques',
    p_dashboard_earnings: 'Voir revenus',
    p_credits_view: 'Voir crédits',
    p_credits_buy: 'Acheter crédits',
    p_chat_respond: 'Répondre message',
    p_notif_receive: 'Recevoir notification',
};

export default function BetaTestsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<GlobalStats>({
        totalTesters: 0,
        totalTests: 0,
        workingTests: 0,
        brokenTests: 0,
        pendingTests: 0,
        completionRate: 0,
    });
    const [testers, setTesters] = useState<TesterSummary[]>([]);
    const [brokenTests, setBrokenTests] = useState<TestResult[]>([]);
    const [expandedTester, setExpandedTester] = useState<string | null>(null);
    const [testerDetails, setTesterDetails] = useState<Record<string, TestResult[]>>({});

    useEffect(() => {
        fetchBetaTestData();
    }, []);

    const fetchBetaTestData = async () => {
        setLoading(true);
        try {
            // Fetch all test results
            const { data: allResults, error: resultsError } = await supabase
                .from('beta_test_results')
                .select('*')
                .order('tested_at', { ascending: false });

            if (resultsError) throw resultsError;

            // Calculate global stats
            const workingTests = allResults?.filter(r => r.status === 'working').length || 0;
            const brokenTestsCount = allResults?.filter(r => r.status === 'broken').length || 0;
            const pendingTests = allResults?.filter(r => r.status === 'pending').length || 0;
            const totalTests = allResults?.length || 0;

            // Get unique testers
            const uniqueTesters = new Set(allResults?.map(r => r.user_id));

            setStats({
                totalTesters: uniqueTesters.size,
                totalTests,
                workingTests,
                brokenTests: brokenTestsCount,
                pendingTests,
                completionRate: totalTests > 0 ? Math.round(((workingTests + brokenTestsCount) / totalTests) * 100) : 0,
            });

            // Get broken tests with comments
            const brokenWithComments = allResults?.filter(r => r.status === 'broken') || [];
            setBrokenTests(brokenWithComments);

            // Group results by user for summary
            const userGroups: Record<string, TestResult[]> = {};
            allResults?.forEach(result => {
                if (!userGroups[result.user_id]) {
                    userGroups[result.user_id] = [];
                }
                userGroups[result.user_id].push(result);
            });

            // Fetch user details for each tester
            const userIds = Object.keys(userGroups);
            const { data: users } = await supabase
                .from('users')
                .select('id, first_name, last_name, email')
                .in('id', userIds);

            const testersData: TesterSummary[] = userIds.map(userId => {
                const userResults = userGroups[userId];
                const user = users?.find(u => u.id === userId);
                const working = userResults.filter(r => r.status === 'working').length;
                const broken = userResults.filter(r => r.status === 'broken').length;
                const pending = userResults.filter(r => r.status === 'pending').length;
                const total = userResults.length;

                return {
                    user_id: userId,
                    first_name: user?.first_name || 'Unknown',
                    last_name: user?.last_name || 'User',
                    email: user?.email || '',
                    user_type: userResults[0]?.user_type || 'client',
                    pending_count: pending,
                    working_count: working,
                    broken_count: broken,
                    total_tests: total,
                    completion_rate: total > 0 ? Math.round(((working + broken) / total) * 100) : 0,
                    last_tested_at: userResults[0]?.tested_at || '',
                };
            });

            setTesters(testersData.sort((a, b) => b.completion_rate - a.completion_rate));
            setTesterDetails(userGroups);

        } catch (error) {
            console.error('Error fetching beta test data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTesterDetails = (userId: string) => {
        setExpandedTester(expandedTester === userId ? null : userId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Chargement des résultats...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">🧪 Rapports Beta Test</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Suivi des tests effectués par les beta testeurs.
                    </p>
                </div>
                <Button onClick={fetchBetaTestData} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 shrink-0">
                <Card className="glass-card border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Testeurs</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTesters}</div>
                        <p className="text-xs text-muted-foreground">Beta testeurs actifs</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tests OK</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">{stats.workingTests}</div>
                        <p className="text-xs text-muted-foreground">Fonctionnent correctement</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tests KO</CardTitle>
                        <Bug className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{stats.brokenTests}</div>
                        <p className="text-xs text-muted-foreground">Bugs signalés</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">{stats.pendingTests}</div>
                        <p className="text-xs text-muted-foreground">À tester</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Progression</CardTitle>
                        <AlertCircle className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.completionRate}%</div>
                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${stats.completionRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 flex-1 min-h-0">
                {/* Bugs Signalés */}
                <Card className="flex flex-col glass-card border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bug className="h-5 w-5 text-red-500" />
                            Bugs Signalés ({brokenTests.length})
                        </CardTitle>
                        <CardDescription>Tests échoués avec commentaires</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        {brokenTests.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                🎉 Aucun bug signalé !
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {brokenTests.map((test) => (
                                    <div key={test.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="destructive" className="text-xs">
                                                {TEST_NAMES[test.test_id] || test.test_id}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {test.user_type === 'provider' ? '👨‍💼 Pro' : '👤 Client'}
                                            </Badge>
                                        </div>
                                        {test.comment && (
                                            <p className="text-sm text-foreground mb-2">
                                                💬 {test.comment}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>📱 {test.device_info || 'N/A'}</span>
                                            <span>{new Date(test.tested_at).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Testeurs */}
                <Card className="flex flex-col glass-card border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Testeurs ({testers.length})
                        </CardTitle>
                        <CardDescription>Progression par testeur</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Testeur</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-center">OK</TableHead>
                                    <TableHead className="text-center">KO</TableHead>
                                    <TableHead className="text-right">%</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {testers.map((tester) => (
                                    <>
                                        <TableRow
                                            key={tester.user_id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => toggleTesterDetails(tester.user_id)}
                                        >
                                            <TableCell>
                                                {expandedTester === tester.user_id ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{tester.first_name} {tester.last_name}</div>
                                                <div className="text-xs text-muted-foreground">{tester.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tester.user_type === 'provider' ? 'default' : 'secondary'}>
                                                    {tester.user_type === 'provider' ? '👨‍💼 Pro' : '👤 Client'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center text-emerald-500 font-medium">
                                                {tester.working_count}
                                            </TableCell>
                                            <TableCell className="text-center text-red-500 font-medium">
                                                {tester.broken_count}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant={tester.completion_rate >= 80 ? 'default' : 'outline'}
                                                    className={cn(
                                                        tester.completion_rate >= 80 && 'bg-emerald-500',
                                                        tester.completion_rate >= 50 && tester.completion_rate < 80 && 'bg-orange-500',
                                                        tester.completion_rate < 50 && 'bg-muted'
                                                    )}
                                                >
                                                    {tester.completion_rate}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                        {/* Expanded Details */}
                                        {expandedTester === tester.user_id && testerDetails[tester.user_id] && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="bg-muted/30 p-4">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                        {testerDetails[tester.user_id].map((result) => (
                                                            <div
                                                                key={result.id}
                                                                className={cn(
                                                                    "text-xs p-2 rounded-md border",
                                                                    result.status === 'working' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
                                                                    result.status === 'broken' && 'bg-red-500/10 border-red-500/30 text-red-700',
                                                                    result.status === 'pending' && 'bg-muted border-border text-muted-foreground'
                                                                )}
                                                            >
                                                                <div className="font-medium truncate">
                                                                    {result.status === 'working' && '✅ '}
                                                                    {result.status === 'broken' && '❌ '}
                                                                    {result.status === 'pending' && '⏳ '}
                                                                    {TEST_NAMES[result.test_id] || result.test_id}
                                                                </div>
                                                                {result.comment && (
                                                                    <div className="text-[10px] mt-1 opacity-75 truncate">
                                                                        💬 {result.comment}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
