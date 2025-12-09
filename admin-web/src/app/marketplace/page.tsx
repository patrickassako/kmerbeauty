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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MoreHorizontal, CheckCircle, XCircle, Package, Trash2, ExternalLink } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { ProductDetailsSheet } from "@/components/marketplace/ProductDetailsSheet";

type Product = {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    currency: string;
    images: string[];
    seller_id: string;
    is_approved: boolean;
    is_active: boolean;
    created_at: string;
    stock_quantity: number;
    city?: string;
    video_url?: string;
};

export default function MarketplacePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Details Sheet State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        let query = supabase
            .from('marketplace_products')
            .select('*')
            .order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.ilike('name', `%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (!error && data) {
            setProducts(data as Product[]);
        } else if (error) {
            console.error("Error fetching products:", error);
        }
        setLoading(false);
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleViewDetails = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailsOpen(true);
    };

    const handleApprove = async (id: string) => {
        if (!confirm("Voulez-vous approuver ce produit ? Il sera visible sur la marketplace.")) return;

        const { error } = await supabase
            .from('marketplace_products')
            .update({ is_approved: true, approved_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            setProducts(products.map(p => p.id === id ? { ...p, is_approved: true } : p));
            setIsDetailsOpen(false); // Close sheet if open
        } else {
            alert("Erreur lors de l'approbation: " + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.")) return;

        const { error } = await supabase
            .from('marketplace_products')
            .delete()
            .eq('id', id);

        if (!error) {
            setProducts(products.filter(p => p.id !== id));
            setIsDetailsOpen(false); // Close sheet if open
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

    const pendingProducts = products.filter(p => !p.is_approved);

    const ProductTable = ({ data }: { data: Product[] }) => (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                Chargement...
                            </TableCell>
                        </TableRow>
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                Aucun produit trouvé.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((product) => (
                            <TableRow
                                key={product.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleViewDetails(product)}
                            >
                                <TableCell>
                                    <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Package className="h-5 w-5 text-gray-500" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div>
                                        <div className="font-bold">{product.name}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{product.category || "Autre"}</Badge>
                                </TableCell>
                                <TableCell>
                                    {formatCurrency(product.price)}
                                </TableCell>
                                <TableCell>
                                    {product.stock_quantity}
                                </TableCell>
                                <TableCell>
                                    {product.is_approved ? (
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                            Approuvé
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                            En attente
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(product.id); }}>
                                                Copier ID
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(product); }}>
                                                Voir détails
                                            </DropdownMenuItem>
                                            {!product.is_approved && (
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleApprove(product.id); }} className="text-green-600">
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Approuver
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }} className="text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Supprimer
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
                    <h2 className="text-3xl font-bold tracking-tight">Marketplace</h2>
                    <p className="text-muted-foreground">
                        Gérez les produits mis en vente par les prestataires
                    </p>
                </div>
            </div>

            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Rechercher un produit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending" className="relative">
                        En attente
                        {pendingProducts.length > 0 && (
                            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                                {pendingProducts.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="all">Tous les produits ({products.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="space-y-4">
                    <ProductTable data={pendingProducts} />
                </TabsContent>
                <TabsContent value="all" className="space-y-4">
                    <ProductTable data={products} />
                </TabsContent>
            </Tabs>

            <ProductDetailsSheet
                product={selectedProduct}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                onApprove={handleApprove}
                onDelete={handleDelete}
            />
        </div>
    );
}
