"use client";

// TEMPORARILY DISABLED - Uncomment to re-enable
// import { InstallAppPopup, useInstallAppPopup } from '@/components/InstallAppPopup';

export function InstallAppPopupWrapper() {
    // Popup disabled for now
    return null;

    // To re-enable, uncomment below:
    // const { showPopup, closePopup } = useInstallAppPopup();
    // if (!showPopup) return null;
    // return <InstallAppPopup onClose={closePopup} />;
}
