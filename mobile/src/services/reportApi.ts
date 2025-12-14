import api from './api';

export type ReportReason =
    | 'harassment'
    | 'spam'
    | 'inappropriate'
    | 'scam'
    | 'suspicious'
    | 'other';

export type ContextType = 'chat' | 'booking' | 'profile';

export interface CreateReportData {
    reported_id: string;
    reason: ReportReason;
    description?: string;
    screenshot_url?: string;
    context_type?: ContextType;
    context_id?: string;
}

export interface UserReport {
    id: string;
    reporter_id: string;
    reported_id: string;
    reason: ReportReason;
    description?: string;
    screenshot_url?: string;
    context_type?: ContextType;
    context_id?: string;
    status: string;
    created_at: string;
    reported_user?: {
        id: string;
        first_name: string;
        last_name: string;
        avatar?: string;
    };
}

export interface UserBlock {
    id: string;
    blocker_id: string;
    blocked_id: string;
    reason?: string;
    created_at: string;
    blocked_user?: {
        id: string;
        first_name: string;
        last_name: string;
        avatar?: string;
    };
}

export const reportReasons: { value: ReportReason; label: string; emoji: string }[] = [
    { value: 'harassment', label: 'Harcèlement', emoji: '😡' },
    { value: 'spam', label: 'Spam', emoji: '📧' },
    { value: 'inappropriate', label: 'Contenu inapproprié', emoji: '🚫' },
    { value: 'scam', label: 'Arnaque / Fraude', emoji: '💸' },
    { value: 'suspicious', label: 'Comportement suspect', emoji: '🤔' },
    { value: 'other', label: 'Autre', emoji: '📝' },
];

/**
 * Create a report for a user
 */
export const createReport = async (data: CreateReportData): Promise<UserReport> => {
    const response = await api.post('/reports', data);
    return response.data;
};

/**
 * Get my sent reports
 */
export const getMyReports = async (): Promise<UserReport[]> => {
    const response = await api.get('/reports/my');
    return response.data;
};

/**
 * Block a user
 */
export const blockUser = async (userId: string, reason?: string): Promise<UserBlock> => {
    const response = await api.post(`/reports/blocks/${userId}`, { reason });
    return response.data;
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/reports/blocks/${userId}`);
    return response.data;
};

/**
 * Get list of blocked users
 */
export const getBlockedUsers = async (): Promise<UserBlock[]> => {
    const response = await api.get('/reports/blocks');
    return response.data;
};

/**
 * Check if a specific user is blocked by me
 */
export const checkIfBlocked = async (userId: string): Promise<{ isBlocked: boolean }> => {
    const response = await api.get(`/reports/blocks/check/${userId}`);
    return response.data;
};

/**
 * Check mutual block (either direction)
 */
export const checkMutualBlock = async (userId: string): Promise<{ isBlocked: boolean }> => {
    const response = await api.get(`/reports/blocks/mutual/${userId}`);
    return response.data;
};
