import { ProfileSidebar } from '@/components/profile/ProfileSidebar';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            <ProfileSidebar />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
