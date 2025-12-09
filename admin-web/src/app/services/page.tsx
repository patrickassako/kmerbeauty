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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
// Removed missing components: Select, Textarea
import { Search, Plus, Edit, Trash2, Star, ArrowUp, ArrowDown, Loader2, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Enum from database
const CATEGORIES = [
    "HAIRDRESSING",
    "EYE_CARE",
    "WELLNESS_MASSAGE",
    "FACIAL",
    "NAIL_CARE",
    "MAKEUP",
    "WAXING",
    "BARBER",
    "OTHER"
];

type Service = {
    id: string;
    name_fr: string;
    name_en: string;
    description_fr: string | null;
    description_en: string | null;
    category: string;
    base_price: number;
    duration: number;
    priority: number;
    images: string[] | null;
    is_active: boolean;
};

const ITEMS_PER_PAGE = 20;

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formData, setFormData] = useState<Partial<Service>>({
        name_fr: "",
        name_en: "",
        description_fr: "",
        description_en: "",
        category: "OTHER",
        base_price: 0,
        duration: 30,
        priority: 0,
        images: []
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('services')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('services').getPublicUrl(filePath);

            if (data) {
                const currentImages = formData.images || [];
                setFormData({ ...formData, images: [...currentImages, data.publicUrl] });
            }
        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        const currentImages = formData.images || [];
        setFormData({
            ...formData,
            images: currentImages.filter((_, index) => index !== indexToRemove)
        });
    };

    useEffect(() => {
        fetchServices();
    }, [currentPage]); // Refetch when page changes

    const fetchServices = async () => {
        setLoading(true);

        // Calculate range
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
            .from('services')
            .select('*', { count: 'exact' })
            .order('priority', { ascending: false })
            .order('name_fr', { ascending: true })
            .range(from, to);

        if (searchTerm) {
            query = query.or(`name_fr.ilike.%${searchTerm}%,name_en.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query;

        if (!error && data) {
            setServices(data as Service[]);
            if (count !== null) setTotalCount(count);
        } else if (error) {
            console.error("Error fetching services:", error);
        }
        setLoading(false);
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to page 1 on search
            fetchServices();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleOpenDialog = (service?: Service) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name_fr: service.name_fr,
                name_en: service.name_en,
                description_fr: service.description_fr || "",
                description_en: service.description_en || "",
                category: service.category,
                base_price: service.base_price,
                duration: service.duration,
                priority: service.priority,
                images: service.images || []
            });
        } else {
            setEditingService(null);
            setFormData({
                name_fr: "",
                name_en: "",
                description_fr: "",
                description_en: "",
                category: "OTHER",
                base_price: 0,
                duration: 30,
                priority: 0,
                images: []
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name_fr || !formData.name_en || !formData.base_price || !formData.duration) {
            alert("Veuillez remplir les champs obligatoires (Noms, Prix, Durée)");
            return;
        }

        setActionLoading(true);
        try {
            if (editingService) {
                // Update
                const { error } = await supabase
                    .from('services')
                    .update(formData)
                    .eq('id', editingService.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('services')
                    .insert([formData]);
                if (error) throw error;
            }

            await fetchServices();
            setIsDialogOpen(false);
        } catch (error: any) {
            alert("Erreur: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (!confirm("Voulez-vous vraiment supprimer ce service ?")) return;

        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (!error) {
            setServices(services.filter(s => s.id !== id));
            setTotalCount(prev => prev - 1);
        } else {
            alert("Erreur lors de la suppression: " + error.message);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-CM", {
            style: "currency",
            currency: "XAF",
        }).format(amount);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Services</h2>
                    <p className="text-muted-foreground">
                        Gérez le catalogue des services proposés sur la plateforme.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter un service
                </Button>
            </div>

            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Rechercher un service..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Nom (FR)</TableHead>
                            <TableHead>Nom (EN)</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Prix de base</TableHead>
                            <TableHead>Durée</TableHead>
                            <TableHead>Priorité</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Chargement...
                                </TableCell>
                            </TableRow>
                        ) : services.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    Aucun service trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            services.map((service) => (
                                <TableRow
                                    key={service.id}
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleOpenDialog(service)}
                                >
                                    <TableCell>
                                        <div className="h-10 w-10 rounded-md bg-gray-100 overflow-hidden">
                                            {service.images && service.images[0] ? (
                                                <img src={service.images[0]} alt={service.name_fr} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                    <Star className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{service.name_fr}</TableCell>
                                    <TableCell>{service.name_en}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{service.category}</Badge>
                                    </TableCell>
                                    <TableCell>{formatCurrency(service.base_price)}</TableCell>
                                    <TableCell>{service.duration} min</TableCell>
                                    <TableCell>
                                        {service.priority > 0 && (
                                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                                                <Star className="mr-1 h-3 w-3 fill-current" /> {service.priority}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenDialog(service); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(service.id, e)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                    Affichage de {services.length} sur {totalCount} services
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || loading}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
                    </Button>
                    <div className="text-sm font-medium">
                        Page {currentPage} sur {Math.max(totalPages, 1)}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || loading}
                    >
                        Suivant <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{editingService ? "Modifier le service" : "Ajouter un service"}</DialogTitle>
                        <DialogDescription>
                            Remplissez les informations du service ci-dessous.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">

                        <div className="space-y-2">
                            <Label>Images du service</Label>
                            <div className="grid grid-cols-4 gap-4 mb-4">
                                {formData.images?.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border group">
                                        <img src={url} alt={`Service ${index + 1}`} className="h-full w-full object-cover" />
                                        <button
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            type="button"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                <div className="aspect-square rounded-md border border-dashed flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors relative">
                                    {uploading ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                    ) : (
                                        <>
                                            <Upload className="h-6 w-6 text-gray-400" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name_fr">Nom (Français) *</Label>
                                <Input
                                    id="name_fr"
                                    value={formData.name_fr}
                                    onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name_en">Nom (Anglais) *</Label>
                                <Input
                                    id="name_en"
                                    value={formData.name_en}
                                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie *</Label>
                                <select
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priorité (0 = Normal)</Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="base_price">Prix de base (XAF) *</Label>
                                <Input
                                    id="base_price"
                                    type="number"
                                    value={formData.base_price}
                                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Durée (minutes) *</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description_fr">Description (Français)</Label>
                            <textarea
                                id="description_fr"
                                value={formData.description_fr || ""}
                                onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description_en">Description (Anglais)</Label>
                            <textarea
                                id="description_en"
                                value={formData.description_en || ""}
                                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
