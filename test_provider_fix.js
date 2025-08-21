const { PrivacySecurityCSVReportGenerator } = require('./privacySecurityCsvReportGenerator');

// Test the fix with NEW provider
const generator = new PrivacySecurityCSVReportGenerator();

// Mock test result
const testResult = {
    attackMode: 'test-attack',
    success: false,
    promptTokensUsed: 688,
    completionTokensUsed: 22,
    transcript: []
};

// Test with NEW provider
console.log('Testing with openai-new provider:');
const detectedModelNew = generator.detectModelFromResult(testResult, 'openai-new');
console.log('Detected model:', detectedModelNew);

// Test with OLD provider
console.log('\nTesting with openai-old provider:');
const detectedModelOld = generator.detectModelFromResult(testResult, 'openai-old');
console.log('Detected model:', detectedModelOld);

// Test without provider (fallback)
console.log('\nTesting without provider:');
const detectedModelFallback = generator.detectModelFromResult(testResult);
console.log('Detected model:', detectedModelFallback);
