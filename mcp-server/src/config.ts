import dotenv from 'dotenv';
dotenv.config();

export const config = {
    apiBaseUrl: process.env.KMERBEAUTY_API_URL || 'https://kmerbeauty-production.up.railway.app/api/v1',
    agentKey: process.env.WHATSAPP_AGENT_KEY || '',
    serverPort: parseInt(process.env.MCP_SERVER_PORT || '3001', 10),
};

export function validateConfig() {
    if (!config.agentKey) {
        console.warn('⚠️ WHATSAPP_AGENT_KEY is not set. Agent endpoints will fail.');
    }
    console.log('📍 API Base URL:', config.apiBaseUrl);
}
