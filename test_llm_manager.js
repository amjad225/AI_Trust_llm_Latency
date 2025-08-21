// Quick test to verify LLMManager provider information
const LLMManager = require('./botium-box/packages/botium-llm-manager/src');

// Simulate the same setup as app.js
const targetLLM = { provider: 'openai-new' };
const finalProvider = 'openai-new';

const ctx = {
    log: {
        debug: (...args) => console.log(...args),
        info: (...args) => console.log(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args)
    }
};

const llmManager = new LLMManager(
    ctx,
    { ...targetLLM, llmProvider: finalProvider },
);

console.log('llmManager properties:');
console.log('- llmManager.provider:', llmManager.provider);
console.log('- llmManager.llmProvider:', llmManager.llmProvider);
console.log('- llmManager.config?.provider:', llmManager.config?.provider);
console.log('- llmManager.config?.llmProvider:', llmManager.config?.llmProvider);

// Show all properties
console.log('\nAll llmManager properties:');
console.log(Object.keys(llmManager));
