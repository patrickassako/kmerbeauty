"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Report = {
    id: string;
    reason: string;
    status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
    created_at: string;
    reporter?: {
        email: string;
        first_name: string;
        last_name: string;
    };
    targetUser?: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
    };
};

export default function ModerationPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('reports')
            .select(`
        *,
        reporter:users!reporter_id(email, first_name, last_name),
        targetUser:users!target_user_id(id, email, first_name, last_name)
      `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setReports(data as any);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase
            .from('reports')
            .update({ status })
            .eq('id', id);

        if (!error) {
            setReports(reports.map(r => r.id === id ? { ...r, status: status as any } : r));
        }
    };

    const pendingReports = reports.filter(r => r.status === 'PENDING' || r.status === 'REVIEWING');
    const resolvedReports = reports.filter(r => r.status === 'RESOLVED' || r.status === 'DISMISSED');

    const ReportsTable = ({ data }: { data: Report[] }) => (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Signalé par</TableHead>
                        <TableHead>Cible</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Chargement...
                            </TableCell>
                        </TableRow>
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Aucun signalement.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((report) => (
                            <TableRow key={report.id}>
                                <TableCell>
                                    <div className="font-medium">
                                        {report.reporter?.first_name} {report.reporter?.last_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{report.reporter?.email}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-red-600">
                                        {report.targetUser?.first_name} {report.targetUser?.last_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{report.targetUser?.email}</div>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={report.reason}>
                                    {report.reason}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={report.status === 'PENDING' ? "destructive" : "outline"}>
                                        {report.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {new Date(report.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    {report.status === 'PENDING' && (
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => updateStatus(report.id, 'DISMISSED')}>
                                                Ignorer
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => updateStatus(report.id, 'RESOLVED')}>
                                                Traiter
                                            </Button>
                                        </div>
                                    )}
                                    {report.status !== 'PENDING' && (
                                        <span className="text-xs text-muted-foreground">Traité</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Modération</h2>
                    <p className="text-muted-foreground">
                        Gérez les signalements et la sécurité de la plateforme
                    </p>
                </div>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending" className="relative">
                        À traiter
                        {pendingReports.length > 0 && (
                            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                                {pendingReports.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history">Historique</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="space-y-4">
                    <ReportsTable data={pendingReports} />
                </TabsContent>
                <TabsContent value="history" className="space-y-4">
                    <ReportsTable data={resolvedReports} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
