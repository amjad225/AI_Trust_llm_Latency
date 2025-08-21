/**
 * Privacy & Security Report Generator
 * Comprehensive reporting system for Privacy & Security testing with CSV analysis
 */

const fs = require('fs');
const path = require('path');
const { PrivacySecurityCSVReportGenerator } = require('./privacySecurityCsvReportGenerator');

/**
 * Generate comprehensive Privacy & Security summary report
 * @param {Array} allResults - All test results
 * @param {Array} reportPaths - Existing report paths
 * @param {string} uniqueTimestamp - Unique timestamp for the session
 * @param {Object} summaryMetrics - Summary metrics from SecurityTestManager
 * @param {string} llmProvider - Optional LLM provider information (e.g., 'openai-new', 'openai-old')
 * @returns {string} - Path to the generated summary report
 */
function generatePrivacySecuritySummaryReport(allResults, reportPaths, uniqueTimestamp, summaryMetrics, llmProvider = null) {
    try {
        console.log('\n🔄 Generating comprehensive Privacy & Security CSV analysis...');
        
        // Create logs directory if it doesn't exist
        const logsDir = path.join(__dirname, 'logs', uniqueTimestamp);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Log basic information
        console.log(`📁 Session directory: ${logsDir}`);
        console.log(`📊 Processing ${allResults.length} test results`);
        console.log(`🎯 Summary metrics: ${summaryMetrics.totalViolations} violations, ${summaryMetrics.successRate}% success rate`);

        // Generate comprehensive CSV report with detailed analysis
        console.log('📋 Generating comprehensive CSV analysis with token costs...');
        console.log(`🔍 DEBUG: generatePrivacySecuritySummaryReport received llmProvider = "${llmProvider}"`);
        const csvGenerator = new PrivacySecurityCSVReportGenerator();
        const csvReportPath = csvGenerator.generateCSVReport(allResults, summaryMetrics, uniqueTimestamp, llmProvider);

        // Use existing HTML report generation (no changes to current output)
        let htmlReportPath = null;
        if (reportPaths && reportPaths.length > 0) {
            htmlReportPath = reportPaths[0]; // Use existing HTML report
        }

        // Generate summary log file
        console.log('📝 Generating summary log...');
        const summaryLogPath = generateSummaryLog(allResults, summaryMetrics, uniqueTimestamp, logsDir);

        // Create session metadata file
        console.log('🏷️ Creating session metadata...');
        const metadataPath = createSessionMetadata(allResults, summaryMetrics, uniqueTimestamp, logsDir);

        console.log('\n✅ Privacy & Security report generation completed!');
        console.log(`📊 CSV Report: ${csvReportPath}`);
        if (htmlReportPath) {
            console.log(`🌐 HTML Report: ${htmlReportPath}`);
        }
        console.log(`📝 Summary Log: ${summaryLogPath}`);
        console.log(`🏷️ Metadata: ${metadataPath}`);

        // Return the existing HTML report path or CSV path for consistency
        return htmlReportPath || csvReportPath;

    } catch (error) {
        console.error('❌ Error generating Privacy & Security summary report:', error);
        throw error;
    }
}

/**
 * Generate detailed summary log file
 */
function generateSummaryLog(allResults, summaryMetrics, uniqueTimestamp, logsDir) {
    const logPath = path.join(logsDir, 'privacy_security_summary.log');
    
    const logLines = [
        '='.repeat(80),
        'PRIVACY & SECURITY ASSESSMENT SUMMARY',
        '='.repeat(80),
        `Session ID: ${uniqueTimestamp}`,
        `Generated: ${new Date().toISOString()}`,
        `Total Tests: ${allResults.length}`,
        `Successful Violations: ${summaryMetrics.attacksWithViolations || 0}`,
        `Total Violations: ${summaryMetrics.totalViolations || 0}`,
        `Success Rate: ${summaryMetrics.successRate || 0}%`,
        `Overall Result: ${summaryMetrics.success ? 'VULNERABLE (Security Issues Found)' : 'SECURE (No Major Issues)'}`,
        '',
        '='.repeat(80),
        'ATTACK MODE BREAKDOWN',
        '='.repeat(80)
    ];

    // Calculate attack mode statistics
    const attackModeStats = calculateAttackModeBreakdown(allResults);
    
    Object.entries(attackModeStats).forEach(([mode, stats]) => {
        logLines.push(`${mode}:`);
        logLines.push(`  Tests: ${stats.total}`);
        logLines.push(`  Successful: ${stats.successful}`);
        logLines.push(`  Success Rate: ${stats.successRate.toFixed(1)}%`);
        logLines.push(`  Violations: ${stats.violations}`);
        logLines.push('');
    });

    logLines.push('='.repeat(80));
    logLines.push('VIOLATION ANALYSIS');
    logLines.push('='.repeat(80));

    // Calculate violation statistics
    const violationStats = calculateViolationBreakdown(allResults);
    
    Object.entries(violationStats).forEach(([type, count]) => {
        logLines.push(`${type}: ${count} occurrences`);
    });

    logLines.push('');
    logLines.push('='.repeat(80));
    logLines.push('PRIVACY vs SECURITY BREAKDOWN');
    logLines.push('='.repeat(80));

    const privacySecurityBreakdown = categorizePrivacyVsSecurity(allResults);
    
    logLines.push(`Privacy Violations: ${privacySecurityBreakdown.privacy.violations} (${privacySecurityBreakdown.privacy.tests} tests)`);
    logLines.push(`Security Violations: ${privacySecurityBreakdown.security.violations} (${privacySecurityBreakdown.security.tests} tests)`);

    logLines.push('');
    logLines.push('='.repeat(80));
    logLines.push('DETAILED TEST RESULTS');
    logLines.push('='.repeat(80));

    allResults.forEach((result, index) => {
        const violations = result.analysisReport?.violations || [];
        logLines.push(`Test ${index + 1}: ${result.attackMode || 'Unknown'}`);
        logLines.push(`  Status: ${result.success ? 'VULNERABLE' : 'SECURE'}`);
        logLines.push(`  Violations: ${violations.length}`);
        if (violations.length > 0) {
            violations.forEach((violation, vIndex) => {
                logLines.push(`    ${vIndex + 1}. ${violation.violationType} (${violation.severity || 'Unknown'})`);
            });
        }
        logLines.push('');
    });

    logLines.push('='.repeat(80));
    logLines.push('END OF REPORT');
    logLines.push('='.repeat(80));

    fs.writeFileSync(logPath, logLines.join('\n'), 'utf8');
    return logPath;
}

/**
 * Create session metadata file
 */
function createSessionMetadata(allResults, summaryMetrics, uniqueTimestamp, logsDir) {
    const metadataPath = path.join(logsDir, 'session_metadata.json');
    
    const metadata = {
        sessionId: uniqueTimestamp,
        generatedAt: new Date().toISOString(),
        testType: 'Privacy & Security',
        totalTests: allResults.length,
        successfulAttacks: summaryMetrics.attacksWithViolations || 0,
        totalViolations: summaryMetrics.totalViolations || 0,
        successRate: summaryMetrics.successRate || 0,
        overallSecure: !summaryMetrics.success,
        attackModes: [...new Set(allResults.map(r => r.attackMode).filter(Boolean))],
        violationTypes: [...new Set(
            allResults.flatMap(r => 
                (r.analysisReport?.violations || []).map(v => v.violationType)
            ).filter(Boolean)
        )],
        modelsUsed: [...new Set(allResults.map(r => r.model).filter(Boolean))],
        reportFiles: {
            csvReport: 'privacy_security_comparative_analysis.csv',
            htmlReport: 'privacy_security_report.html',
            summaryLog: 'privacy_security_summary.log',
            metadata: 'session_metadata.json'
        },
        performance: {
            averageResponseTime: calculateAverageResponseTime(allResults),
            totalExecutionTime: allResults.reduce((sum, r) => sum + (r.executionTime || 0), 0),
            fastestTest: Math.min(...allResults.map(r => r.executionTime || 0).filter(t => t > 0)),
            slowestTest: Math.max(...allResults.map(r => r.executionTime || 0))
        }
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    return metadataPath;
}

/**
 * Calculate attack mode breakdown
 */
function calculateAttackModeBreakdown(allResults) {
    const stats = {};
    
    allResults.forEach(result => {
        const mode = result.attackMode || 'Unknown';
        if (!stats[mode]) {
            stats[mode] = { total: 0, successful: 0, violations: 0 };
        }
        
        stats[mode].total++;
        if (result.success) {
            stats[mode].successful++;
        }
        
        const violations = result.analysisReport?.violations || [];
        stats[mode].violations += violations.length;
    });
    
    // Calculate success rates
    Object.keys(stats).forEach(mode => {
        const s = stats[mode];
        s.successRate = s.total > 0 ? (s.successful / s.total) * 100 : 0;
    });
    
    return stats;
}

/**
 * Calculate violation type breakdown
 */
function calculateViolationBreakdown(allResults) {
    const stats = {};
    
    allResults.forEach(result => {
        const violations = result.analysisReport?.violations || [];
        violations.forEach(violation => {
            const type = violation.violationType || 'Unknown';
            stats[type] = (stats[type] || 0) + 1;
        });
    });
    
    return stats;
}

/**
 * Categorize results into Privacy vs Security
 */
function categorizePrivacyVsSecurity(allResults) {
    const privacy = { tests: 0, violations: 0 };
    const security = { tests: 0, violations: 0 };
    
    // Keywords for categorization
    const privacyKeywords = ['privacy', 'personal', 'data', 'information', 'pii', 'gdpr', 'ccpa'];
    const securityKeywords = ['security', 'attack', 'vulnerability', 'exploit', 'injection', 'bypass'];
    
    allResults.forEach(result => {
        const attackMode = (result.attackMode || '').toLowerCase();
        const category = (result.category || '').toLowerCase();
        
        const isPrivacy = privacyKeywords.some(keyword => 
            attackMode.includes(keyword) || category.includes(keyword)
        );
        const isSecurity = securityKeywords.some(keyword => 
            attackMode.includes(keyword) || category.includes(keyword)
        );
        
        // Default to security if unclear
        const targetCategory = isPrivacy && !isSecurity ? privacy : security;
        
        targetCategory.tests++;
        const violations = result.analysisReport?.violations || [];
        targetCategory.violations += violations.length;
    });
    
    return { privacy, security };
}

/**
 * Calculate average response time
 */
function calculateAverageResponseTime(allResults) {
    const times = allResults.map(r => r.executionTime || 0).filter(t => t > 0);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
}

module.exports = {
    generatePrivacySecuritySummaryReport
};
