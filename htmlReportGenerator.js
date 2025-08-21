/**
 * Enhanced HTML Report Generator with Agent Content Tracking
 * Provides clear visual differentiation between traditional and agentic approaches
 */

const fs = require('fs');
const path = require('path');

// Add HTML escaping function
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Enhanced HTML Report Generator that clearly distinguishes agent-generated content
 */
function generateHTMLReport(result, analysisReport, uniqueTimestamp, filename) {
    try {
        // Determine if this is an agent-generated report
        const isAgentGenerated = result?.approach === 'agentic' || 
                                result?.agentMetrics || 
                                analysisReport?.agentSpecific ||
                                filename?.includes('agent');
        
        // Create logs directory if it doesn't exist
        const logsDir = path.join(__dirname, 'logs', uniqueTimestamp);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const reportPath = path.join(logsDir, `${filename}.html`);
        
        // Generate approach-specific styles and content
        const approachBadge = isAgentGenerated 
            ? `<span class="approach-badge agent-badge">🤖 AGENTIC APPROACH</span>`
            : `<span class="approach-badge traditional-badge">🔄 TRADITIONAL APPROACH</span>`;
            
        const approachStyles = isAgentGenerated 
            ? generateAgentStyles() 
            : generateTraditionalStyles();
            
        const approachSpecificContent = isAgentGenerated 
            ? generateAgentSpecificContent(result, analysisReport)
            : '';

        // Generate the main HTML content
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bias Testing Report - ${analysisReport?.attackMode || 'Unknown'} (${isAgentGenerated ? 'Agentic' : 'Traditional'})</title>
    <style>
        ${generateBaseStyles()}
        ${approachStyles}
    </style>
</head>
<body>
    <div class="container ${isAgentGenerated ? 'agent-container' : 'traditional-container'}">
        <!-- Header Section -->
        <div class="header">
            ${approachBadge}
            <h1>Bias Testing Report</h1>
            <div class="report-meta">
                <div class="meta-item">
                    <label>Attack Mode:</label>
                    <span class="attack-mode">${escapeHtml(analysisReport?.attackMode || 'Unknown')}</span>
                </div>
                <div class="meta-item">
                    <label>Domain:</label>
                    <span>${escapeHtml(analysisReport?.domain || result?.domain || 'Unknown')}</span>
                </div>
                <div class="meta-item">
                    <label>Generated:</label>
                    <span>${new Date().toLocaleString()}</span>
                </div>
                <div class="meta-item">
                    <label>Total Turns:</label>
                    <span>${analysisReport?.totalTurns || result?.turns || 0}</span>
                </div>
            </div>
        </div>

        <!-- Summary Section -->
        <div class="summary-section">
            <h2>Summary</h2>
            <div class="summary-grid">
                <div class="summary-card ${(analysisReport?.successfulAttacks > 0 || (analysisReport?.violations && analysisReport?.violations.length > 0)) ? 'success' : 'no-success'}">
                    <div class="summary-value">${(analysisReport?.successfulAttacks > 0 || (analysisReport?.violations && analysisReport?.violations.length > 0)) ? 'YES' : 'NO'}</div>
                    <div class="summary-label">Bias Detected</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${analysisReport?.violations?.length || 0}</div>
                    <div class="summary-label">Violations Found</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${(analysisReport?.successRate || 0).toFixed(1)}%</div>
                    <div class="summary-label">Success Rate</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${analysisReport?.successfulAttacks || 0}</div>
                    <div class="summary-label">Successful Attacks</div>
                </div>
            </div>
        </div>

        ${approachSpecificContent}

        <!-- Violations Section -->
        ${generateViolationsSection(analysisReport, isAgentGenerated)}

        <!-- Conversation Transcript -->
        ${generateTranscriptSection(result, isAgentGenerated)}

        <!-- Footer -->
        <div class="footer">
            <p>Report generated on ${new Date().toLocaleString()}</p>
            <p class="approach-footer">
                ${isAgentGenerated 
                    ? '🤖 This report was generated using advanced agentic bias testing with adaptive strategies and intelligent agents.' 
                    : '🔄 This report was generated using traditional bias testing methods with proven techniques.'}
            </p>
        </div>
    </div>
</body>
</html>`;

        // Write the HTML file
        fs.writeFileSync(reportPath, htmlContent, 'utf8');
        
        console.log(`📊 ${isAgentGenerated ? 'Agentic' : 'Traditional'} HTML report generated: ${reportPath}`);
        return reportPath;
        
    } catch (error) {
        console.error(`Error generating HTML report: ${error.message}`);
        return null;
    }
}

/**
 * Generate base CSS styles
 */
function generateBaseStyles() {
    return `
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            position: relative;
        }
        
        .approach-badge {
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .header h1 {
            margin: 0 0 20px 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        
        .report-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .meta-item {
            background: rgba(255,255,255,0.1);
            padding: 12px;
            border-radius: 8px;
        }
        
        .meta-item label {
            display: block;
            font-size: 0.9em;
            opacity: 0.8;
            margin-bottom: 5px;
        }
        
        .meta-item span {
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .attack-mode {
            background: rgba(255,255,255,0.2);
            padding: 4px 8px;
            border-radius: 4px;
        }
        
        .summary-section {
            padding: 30px;
            border-bottom: 1px solid #eee;
        }
        
        .summary-section h2 {
            margin: 0 0 20px 0;
            color: #333;
            font-size: 1.8em;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .summary-card {
            background: #f8f9ff;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e1e5e9;
            transition: transform 0.2s;
        }
        
        .summary-card:hover {
            transform: translateY(-2px);
        }
        
        .summary-card.success {
            background: #fff5f5;
            border-color: #fed7d7;
        }
        
        .summary-card.no-success {
            background: #f0fff4;
            border-color: #c6f6d5;
        }
        
        .summary-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .summary-card.success .summary-value {
            color: #e53e3e;
        }
        
        .summary-card.no-success .summary-value {
            color: #38a169;
        }
        
        .summary-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .section {
            padding: 30px;
            border-bottom: 1px solid #eee;
        }
        
        .section h2 {
            margin: 0 0 20px 0;
            color: #333;
            font-size: 1.6em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .footer {
            padding: 20px 30px;
            background: #f8f9fa;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        .approach-footer {
            margin-top: 10px;
            font-style: italic;
        }
    `;
}

/**
 * Generate agent-specific CSS styles
 */
function generateAgentStyles() {
    return `
        .agent-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.8; }
            100% { opacity: 1; }
        }
        
        .agent-container {
            border: 3px solid #667eea;
        }
        
        .agent-specific-section {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            margin: 0;
            padding: 30px;
        }
        
        .agent-metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .agent-metric-card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        
        .agent-metric-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .agent-metric-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        
        .agent-violation {
            border-left: 4px solid #667eea;
            background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(255,255,255,0) 100%);
        }
        
        .agent-attribution {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        
        .strategy-info {
            background: rgba(102, 126, 234, 0.1);
            border: 1px solid #667eea;
            border-radius: 6px;
            padding: 10px;
            margin: 10px 0;
        }
        
        .confidence-high {
            color: #38a169;
            font-weight: bold;
        }
        
        .confidence-medium {
            color: #d69e2e;
            font-weight: bold;
        }
        
        .confidence-low {
            color: #e53e3e;
            font-weight: bold;
        }
    `;
}

/**
 * Generate traditional approach CSS styles
 */
function generateTraditionalStyles() {
    return `
        .traditional-badge {
            background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%);
            color: white;
        }
        
        .traditional-container {
            border: 2px solid #2c5aa0;
        }
        
        .traditional-violation {
            border-left: 4px solid #2c5aa0;
            background: linear-gradient(90deg, rgba(44, 90, 160, 0.1) 0%, rgba(255,255,255,0) 100%);
        }
    `;
}

/**
 * Generate agent-specific content section
 */
function generateAgentSpecificContent(result, analysisReport) {
    const agentMetrics = result?.agentMetrics || analysisReport?.agentSpecific || {};
    
    return `
        <div class="agent-specific-section">
            <h2>🤖 Agent Performance Metrics</h2>
            <div class="agent-metrics-grid">
                <div class="agent-metric-card">
                    <div class="agent-metric-value">${agentMetrics.strategyAdaptations || 0}</div>
                    <div class="agent-metric-label">Strategy Adaptations</div>
                </div>
                <div class="agent-metric-card">
                    <div class="agent-metric-value">${((agentMetrics.averageConfidence || 0) * 100).toFixed(1)}%</div>
                    <div class="agent-metric-label">Average Confidence</div>
                </div>
                <div class="agent-metric-card">
                    <div class="agent-metric-value">${agentMetrics.crossAgentSynergies || 0}</div>
                    <div class="agent-metric-label">Cross-Agent Synergies</div>
                </div>
                <div class="agent-metric-card">
                    <div class="agent-metric-value">${agentMetrics.effectiveStrategies?.length || 0}</div>
                    <div class="agent-metric-label">Effective Strategies</div>
                </div>
            </div>
            
            ${agentMetrics.effectiveStrategies && agentMetrics.effectiveStrategies.length > 0 ? `
                <div style="margin-top: 20px;">
                    <h3>🎯 Most Effective Strategies</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                        ${agentMetrics.effectiveStrategies.map(strategy => 
                            `<span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 20px; font-size: 0.9em;">${escapeHtml(strategy)}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Generate violations section with approach-specific styling
 */
function generateViolationsSection(analysisReport, isAgentGenerated) {
    if (!analysisReport?.violations || analysisReport.violations.length === 0) {
        return `
            <div class="section">
                <h2>📋 Violations</h2>
                <div style="text-align: center; padding: 40px; color: #38a169;">
                    <div style="font-size: 3em; margin-bottom: 10px;">✅</div>
                    <div style="font-size: 1.2em; font-weight: bold;">No bias violations detected</div>
                    <div style="margin-top: 10px; color: #666;">The chatbot handled all test scenarios appropriately.</div>
                </div>
            </div>
        `;
    }
    
    const violationClass = isAgentGenerated ? 'agent-violation' : 'traditional-violation';
    
    return `
        <div class="section">
            <h2>⚠️ Detected Violations</h2>
            <div style="margin-bottom: 20px; color: #666;">
                Found ${analysisReport.violations.length} bias violation${analysisReport.violations.length !== 1 ? 's' : ''} during testing.
                ${isAgentGenerated ? 'Agent-generated violations include enhanced analysis and confidence scoring.' : ''}
            </div>
            
            ${analysisReport.violations.map((violation, index) => {
                const confidence = violation.confidence || 0;
                const confidenceClass = confidence >= 0.8 ? 'confidence-high' : 
                                      confidence >= 0.5 ? 'confidence-medium' : 'confidence-low';
                
                const agentInfo = isAgentGenerated && violation.agentSpecific ? `
                    <div class="strategy-info">
                        <strong>🤖 Agent Analysis:</strong>
                        ${violation.agentSpecific.biasType ? `<div>Bias Type: ${escapeHtml(violation.agentSpecific.biasType)}</div>` : ''}
                        ${violation.agentSpecific.severity ? `<div>Severity: ${escapeHtml(violation.agentSpecific.severity)}</div>` : ''}
                        ${violation.agentSpecific.evidence ? `<div>Evidence: ${escapeHtml(JSON.stringify(violation.agentSpecific.evidence))}</div>` : ''}
                    </div>
                ` : '';
                
                // Handle violatingTextSegments safely
                const segments = (violation.violatingTextSegments && Array.isArray(violation.violatingTextSegments) 
                    ? violation.violatingTextSegments 
                    : [violation.violatingTextSegments || 'No specific segments identified']
                ).filter(segment => segment != null);
                
                return `
                    <div class="violation-card ${violationClass}" style="margin-bottom: 20px; padding: 20px; border-radius: 8px; background: white; border: 1px solid #ddd;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #e53e3e;">Violation ${index + 1} - Turn ${violation.turn}</h3>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span class="${confidenceClass}">Confidence: ${(confidence * 100).toFixed(1)}%</span>
                                ${isAgentGenerated ? '<span class="agent-attribution">🤖 Agent Detected</span>' : ''}
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong>User Message:</strong>
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 5px; font-family: monospace;">
                                ${escapeHtml(violation.userMessage || 'No user message')}
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong>Bot Response:</strong>
                            <div style="background: #fff5f5; padding: 10px; border-radius: 4px; margin-top: 5px; border-left: 4px solid #e53e3e;">
                                ${escapeHtml(violation.botResponse || 'No bot response')}
                            </div>
                        </div>
                        
                        ${segments.length > 0 ? `
                            <div style="margin-bottom: 15px;">
                                <strong>Violating Text Segments:</strong>
                                <div style="margin-top: 5px;">
                                    ${segments.map(segment => `
                                        <div style="background: #ffe6e6; padding: 8px; margin: 5px 0; border-radius: 4px; border-left: 3px solid #ff6b6b;">
                                            ${escapeHtml(String(segment).trim())}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div style="margin-bottom: 15px;">
                            <strong>Analysis:</strong>
                            <div style="background: #f0f7ff; padding: 10px; border-radius: 4px; margin-top: 5px;">
                                ${escapeHtml(violation.reasoning || 'No analysis provided')}
                            </div>
                        </div>
                        
                        ${agentInfo}
                        
                        ${violation.mutationTechniqueUsedFriendly ? `
                            <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                                <strong>Technique Used:</strong> ${escapeHtml(violation.mutationTechniqueUsedFriendly)}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Generate transcript section with agent attribution
 */
function generateTranscriptSection(result, isAgentGenerated) {
    if (!result?.transcript || result.transcript.length === 0) {
        return '';
    }
    
    return `
        <div class="section">
            <h2>💬 Conversation Transcript</h2>
            <div style="margin-bottom: 20px; color: #666;">
                Complete conversation history (${result.transcript.length} turns)
                ${isAgentGenerated ? ' - Generated through agentic interaction with adaptive strategies' : ' - Generated through traditional testing methods'}
            </div>
            
            ${result.transcript.agentMetadata ? `
                <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 8px; border: 1px solid #667eea;">
                    <div style="font-weight: bold; color: #667eea; margin-bottom: 10px; font-size: 1.1em;">🤖 Agent Summary</div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.9em;">
                        <div><strong>Agent:</strong> ${escapeHtml(result.transcript.agentMetadata.agentName)}</div>
                        <div><strong>Type:</strong> ${escapeHtml(result.transcript.agentMetadata.agentType)}</div>
                        <div><strong>Strategies Used:</strong> ${result.transcript.agentMetadata.strategiesUsed.join(', ')}</div>
                        <div><strong>Total Adaptations:</strong> ${result.transcript.agentMetadata.adaptationHistory.length}</div>
                        <div><strong>Final Confidence:</strong> ${(result.transcript.agentMetadata.finalConfidence * 100).toFixed(1)}%</div>
                        <div><strong>Execution Time:</strong> ${(result.transcript.agentMetadata.executionTime / 1000).toFixed(2)}s</div>
                    </div>
                </div>
            ` : ''}
            
            ${result.transcript.map((turn, index) => `
                <div style="margin-bottom: 20px; padding: 15px; background: ${index % 2 === 0 ? '#f8f9fa' : 'white'}; border-radius: 8px; border: 1px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #495057;">Turn ${index + 1}</strong>
                        <div style="display: flex; gap: 8px;">
                            ${turn.agentGenerated ? `<span style="background: #667eea; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold;">🤖 ${escapeHtml(turn.agentName || 'AGENT')}</span>` : `<span style="background: #6c757d; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.75em;">📋 TRADITIONAL</span>`}
                            ${turn.strategy ? `<span style="background: #17a2b8; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.75em;">${escapeHtml(turn.strategy)}</span>` : ''}
                            ${turn.adaptationCount > 0 ? `<span style="background: #fd7e14; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.75em;">🔄 ${turn.adaptationCount} adaptations</span>` : ''}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="font-weight: bold; color: #007bff; margin-bottom: 5px;">👤 User:</div>
                        <div style="padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #007bff;">
                            ${escapeHtml(turn.userMessage || 'No message')}
                        </div>
                    </div>
                    
                    <div>
                        <div style="font-weight: bold; color: #28a745; margin-bottom: 5px;">🤖 Bot:</div>
                        <div style="padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #28a745;">
                            ${escapeHtml(turn.botResponse || 'No response')}
                        </div>
                    </div>
                    
                    ${turn.mutationTechniqueUsedFriendly ? `
                        <div style="margin-top: 10px; font-size: 0.9em; color: #666; font-style: italic;">
                            Technique: ${escapeHtml(turn.mutationTechniqueUsedFriendly)}
                        </div>
                    ` : ''}
                    
                    ${turn.agentGenerated ? `
                        <div style="margin-top: 12px; padding: 8px; background: rgba(102, 126, 234, 0.1); border-radius: 4px; border-left: 3px solid #667eea;">
                            <div style="font-size: 0.85em; color: #667eea; font-weight: bold; margin-bottom: 4px;">🤖 Agent Intelligence</div>
                            <div style="font-size: 0.8em; color: #666; line-height: 1.4;">
                                ${turn.strategyReasoning ? `<div><strong>Strategy:</strong> ${escapeHtml(turn.strategyReasoning)}</div>` : ''}
                                ${turn.confidence ? `<div><strong>Confidence:</strong> ${(turn.confidence * 100).toFixed(1)}%</div>` : ''}
                                ${turn.crossAgentLearning ? `<div><strong>Cross-Agent Learning:</strong> Active</div>` : ''}
                                ${turn.previousStrategies && turn.previousStrategies.length > 0 ? `<div><strong>Previous Strategies:</strong> ${turn.previousStrategies.filter(s => s && s.trim() !== '').join(', ') || 'None'}</div>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

module.exports = {
    generateHTMLReport,
    escapeHtml
};