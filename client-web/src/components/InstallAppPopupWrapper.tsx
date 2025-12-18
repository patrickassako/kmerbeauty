"use client";

import { InstallAppPopup, useInstallAppPopup } from '@/components/InstallAppPopup';

export function InstallAppPopupWrapper() {
    const { showPopup, closePopup } = useInstallAppPopup();

    if (!showPopup) return null;

    return <InstallAppPopup onClose={closePopup} />;
}
