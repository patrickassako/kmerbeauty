'use client';

import { createClient } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Camera, Lock, User, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile Data
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        avatar: ''
    });

    // Password Data
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    // Avatar
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profile) {
                setUser(profile);
                setFormData({
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    phone: profile.phone || '',
                    email: profile.email || authUser.email || '',
                    avatar: profile.avatar || ''
                });
            }
        }
        setLoading(false);
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !user) {
            return;
        }

        setUploadingAvatar(true);
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update User Profile
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 4. Update Local State
            setFormData(prev => ({ ...prev, avatar: publicUrl }));

            // 5. Force refresh UI or Context if needed (Optional)
            alert("Photo de profil mise à jour !");

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            alert('Erreur lors du téléchargement de la photo.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        const { error } = await supabase
            .from('users')
            .update({
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone
            })
            .eq('id', user.id);

        if (error) {
            console.error("Error updating profile:", error);
            alert("Erreur lors de la mise à jour");
        } else {
            alert("Profil mis à jour avec succès");
        }
        setSaving(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordStatus(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordStatus({ type: 'error', message: "Les mots de passe ne correspondent pas." });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordStatus({ type: 'error', message: "Le mot de passe doit contenir au moins 6 caractères." });
            return;
        }

        setChangingPassword(true);

        const { error } = await supabase.auth.updateUser({
            password: passwordData.newPassword
        });

        if (error) {
            setPasswordStatus({ type: 'error', message: error.message });
        } else {
            setPasswordStatus({ type: 'success', message: "Mot de passe modifié avec succès." });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        }
        setChangingPassword(false);
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-10">
            <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>

            {/* Avatar Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-md">
                        {formData.avatar ? (
                            <img src={formData.avatar} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                                <User className="h-10 w-10" />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                    />
                </div>
                <div className="text-center md:text-left">
                    <h3 className="font-bold text-lg">{formData.first_name} {formData.last_name}</h3>
                    <p className="text-gray-500 text-sm">{formData.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Cliquez sur l'icône caméra pour changer votre photo.</p>
                </div>
            </div>

            {/* Profile Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="font-bold">Informations Personnelles</h3>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Prénom</label>
                            <Input
                                className="bg-white text-base md:text-sm"
                                value={formData.first_name}
                                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nom</label>
                            <Input
                                className="bg-white text-base md:text-sm"
                                value={formData.last_name}
                                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <Input
                            className="bg-gray-50 text-gray-500 text-base md:text-sm border-gray-200"
                            value={formData.email}
                            readOnly
                            disabled
                        />
                        <p className="text-xs text-gray-400">L'adresse email ne peut pas être modifiée.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Téléphone</label>
                        <Input
                            className="bg-white text-base md:text-sm"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+237 ..."
                        />
                    </div>

                    <div className="pt-2">
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Enregistrer les modifications
                        </Button>
                    </div>
                </form>
            </div>

            {/* Password Reset Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                    <Lock className="h-5 w-5 text-primary" />
                    <h3 className="font-bold">Sécurité</h3>
                </div>

                {!changingPassword && !passwordStatus && (passwordData.newPassword === '') ? (
                    <Button
                        variant="outline"
                        onClick={() => {
                            setPasswordStatus(null);
                            // Set a dummy char or just state to show form? 
                            // Better to introduce a proper state boolean, but let's use the changingPassword state logic or add one.
                            // User request: " déclenche par un bouton"
                            // I will add a local state check via a small code refactor below to add `showPasswordForm`
                        }}
                        className="w-full justify-start"
                    >
                        <Lock className="mr-2 h-4 w-4" />
                        Changer mon mot de passe
                    </Button>
                ) : (
                    // This block implies I need new state. I should use `showPasswordForm` state.
                    // The ReplaceFileContent might not be enough if I need to add state lines. 
                    // I will use MultiReplace to add state and change JSX.
                    null
                )}
            </div>
        </div>
    );
}
