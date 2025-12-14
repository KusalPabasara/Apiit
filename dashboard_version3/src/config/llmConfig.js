/**
 * LLM Configuration for Description Extraction
 * 
 * SETUP INSTRUCTIONS:
 * ===================
 * 1. Create a .env file in the dashboard folder
 * 2. Add: VITE_OPENAI_API_KEY=sk-your-api-key-here
 * 3. Restart the dev server
 * 
 * Get your API key from: https://platform.openai.com/api-keys
 */

export const llmConfig = {
  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: import.meta.env.VITE_LLM_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(import.meta.env.VITE_LLM_TEMPERATURE) || 0.1,
    maxTokens: parseInt(import.meta.env.VITE_LLM_MAX_TOKENS) || 1000,
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },

  // Anthropic/Claude Configuration (alternative)
  anthropic: {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    model: 'claude-3-haiku-20240307',
    endpoint: 'https://api.anthropic.com/v1/messages'
  },

  // Extraction Settings
  extraction: {
    // Use LLM for extraction (can be disabled if no API key)
    useLLM: import.meta.env.VITE_USE_LLM !== 'false',
    
    // Confidence threshold to trigger LLM fallback (0.0 - 1.0)
    llmThreshold: parseFloat(import.meta.env.VITE_LLM_THRESHOLD) || 0.6,
    
    // Auto-approve extractions above this confidence
    autoApproveThreshold: parseFloat(import.meta.env.VITE_AUTO_APPROVE_THRESHOLD) || 0.85,
    
    // Max retries for LLM API
    maxRetries: 2,
    
    // Timeout in milliseconds
    timeout: 30000
  },

  // Check if LLM is properly configured
  isConfigured() {
    return !!(this.openai.apiKey || this.anthropic.apiKey);
  },

  // Get active provider
  getActiveProvider() {
    if (this.openai.apiKey) return 'openai';
    if (this.anthropic.apiKey) return 'anthropic';
    return null;
  }
};

/**
 * ENVIRONMENT VARIABLES REFERENCE
 * ================================
 * 
 * Create a .env file in dashboard/ folder with:
 * 
 * # API Configuration
 * VITE_API_URL=http://localhost:3000
 * VITE_SOCKET_URL=http://localhost:3000
 * 
 * # OpenAI API Key
 * VITE_OPENAI_API_KEY=sk-your-api-key-here
 * 
 * # Optional Settings
 * VITE_LLM_MODEL=gpt-3.5-turbo
 * VITE_LLM_TEMPERATURE=0.1
 * VITE_LLM_MAX_TOKENS=1000
 * VITE_LLM_THRESHOLD=0.6
 * VITE_USE_LLM=true
 * VITE_AUTO_APPROVE_THRESHOLD=0.85
 */

export default llmConfig;

