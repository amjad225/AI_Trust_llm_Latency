const fs = require('fs');
const path = require('path');

/**
 * CSV Report Generator for Botium Misuse Console App
 * Generates comprehensive CSV reports with comparative analysis
 */
class CSVReportGenerator {
    constructor() {
        this.pricing = {
            // OpenAI Models (January 2025 pricing per 1K tokens) - FOCUS ON OPENAI ONLY
            'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },          // $0.15/1M input, $0.60/1M output
            'gpt-4o': { prompt: 0.005, completion: 0.020 },                  // $5.00/1M input, $20.00/1M output (Realtime API)
            'gpt-4.1': { prompt: 0.002, completion: 0.008 },                 // $2.00/1M input, $8.00/1M output
            'gpt-4.1-mini': { prompt: 0.0004, completion: 0.0016 },          // $0.40/1M input, $1.60/1M output
            'gpt-4.1-nano': { prompt: 0.0001, completion: 0.0004 },          // $0.10/1M input, $0.40/1M output
            'o4-mini': { prompt: 0.0011, completion: 0.0044 },              // $1.10/1M input, $4.40/1M output
            'o3': { prompt: 0.002, completion: 0.008 },                      // $2.00/1M input, $8.00/1M output
            'o3-pro': { prompt: 0.002, completion: 0.008 },                  // Same as o3
            // Legacy OpenAI models for backward compatibility
            'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },         // Legacy pricing
            'gpt-3.5-turbo-16k': { prompt: 0.001, completion: 0.002 },       // Legacy pricing
            'text-davinci-003': { prompt: 0.02, completion: 0.02 }           // Legacy pricing
        };
    }

    /**
     * Generate comprehensive CSV report
     * @param {Object} results - Test results
     * @param {Object} analysisReport - Analysis report
     * @param {string} uniqueTimestamp - Timestamp for filename
     * @param {string} filename - Base filename
     * @returns {string} - Path to generated CSV file
     */
    generateCSVReport(results, analysisReport, uniqueTimestamp) {
        try {
            const csvContent = this.generateCleanCSVContent(results, analysisReport, uniqueTimestamp);
            const filePath = path.join(__dirname, 'logs', uniqueTimestamp, 'agentic_bias_comparative_analysis.csv');
            
            fs.writeFileSync(filePath, csvContent, 'utf8');
            console.log(`📊 CSV report generated: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error('Error generating CSV report:', error);
            throw error;
        }
    }

    /**
     * Generate clean CSV content matching reference format
     */
    generateCleanCSVContent(results, analysisReport, uniqueTimestamp) {
        // Extract actual token usage from log file
        const actualTokenUsage = this.extractTokenUsageFromLog(uniqueTimestamp);
        let totalPromptTokens = actualTokenUsage.promptTokens;
        let totalCompletionTokens = actualTokenUsage.completionTokens;
        const turnTokens = actualTokenUsage.turnTokens || [];
        
        // Extract actual model used from log file
        const actualModelUsed = this.extractModelFromLog(uniqueTimestamp) || 'gpt-4.1-mini';
        
        // Calculate total cost using actual token counts and model
        const totalCostCalculation = this.calculateCosts(totalPromptTokens, totalCompletionTokens, actualModelUsed);
        let totalCost = totalCostCalculation.totalCost;

        // Extract conversation data
        const conversationData = this.extractConversationData(results, analysisReport, uniqueTimestamp);
        
        // Calculate duration
        const duration = this.calculateDuration(results, analysisReport, uniqueTimestamp);
        
        // Get basic info with fallbacks
        const sessionId = uniqueTimestamp;
        const startTime = results?.startTime || analysisReport?.startTime || new Date().toISOString();
        const endTime = results?.endTime || analysisReport?.endTime || new Date().toISOString();
        const llmProvider = (results?.llmProvider || results?.llm?.provider || 'OpenAI').toLowerCase();
        const modelUsed = actualModelUsed; // Use the actual model from log file
        const taskType = 'agentic-bias-testing';
        
        // Enhanced domain extraction - try multiple sources
        let domain = 'unknown';
        if (results?.domain) {
            domain = results.domain;
        } else if (analysisReport?.domain) {
            domain = analysisReport.domain;
        } else {
            // Try to extract domain from log file
            try {
                const logPath = path.join(__dirname, 'logs', uniqueTimestamp, 'log.txt');
                if (fs.existsSync(logPath)) {
                    const logContent = fs.readFileSync(logPath, 'utf8');
                    const domainMatch = logContent.match(/Domains?:\s*([^\s\n,]+)/i);
                    if (domainMatch) {
                        domain = domainMatch[1].trim();
                        // Clean ANSI color codes
                        domain = domain.replace(/\[[0-9;]*m/g, '');
                    }
                }
            } catch (error) {
                // Keep default 'unknown'
            }
        }
        
        // Enhanced attack mode extraction to handle multiple modes
        let attackMode = 'unknown';
        if (results?.results && Array.isArray(results.results) && results.results.length > 0) {
            // Extract attack modes from all results
            const attackModes = results.results
                .map(result => result.attackMode || result.biasType)
                .filter(mode => mode && mode !== 'unknown');
            attackMode = attackModes.length > 0 ? attackModes.join(', ') : 'unknown';
        } else {
            // Fallback for single result format
            attackMode = results?.attackMode || analysisReport?.attackMode || 'unknown';
        }
        
        // Enhanced results aggregation to handle multiple attack modes
        let totalViolations = 0;
        let successRate = 0;
        let totalTurns = conversationData.length || 0;
        let overallSuccess = false;
        
        if (results?.results && Array.isArray(results.results) && results.results.length > 0) {
            // Aggregate metrics from all results
            totalViolations = results.results.reduce((sum, result) => {
                const violations = result.violations || result.totalViolations || 0;
                const violationCount = Array.isArray(violations) ? violations.length : violations;
                return sum + violationCount;
            }, 0);
            
            // If no violations found in results array, try extracting from log file
            if (totalViolations === 0) {
                const logViolations = this.extractViolationCountFromLog(uniqueTimestamp);
                if (logViolations > 0) {
                    totalViolations = logViolations;
                }
            }
            
            // Calculate overall success rate
            const successfulAttacks = results.results.filter(result => 
                result.success || result.violations?.length > 0 || result.totalViolations > 0
            ).length;
            
            // Adjust success rate if we found violations in log but not in results
            if (totalViolations > 0 && successfulAttacks === 0) {
                successRate = 100; // Found violations means success in bias testing
                overallSuccess = true;
            } else {
                successRate = results.results.length > 0 ? (successfulAttacks / results.results.length) * 100 : 0;
            }
            
            // Calculate total turns across all attacks
            totalTurns = results.results.reduce((sum, result) => {
                const turns = result.turns || result.conversationData?.length || 0;
                return sum + turns;
            }, 0);
            
            // Overall success if any attack was successful
            overallSuccess = results.results.some(result => 
                result.success || result.violations?.length > 0 || result.totalViolations > 0
            );
        } else {
            // Enhanced fallback for agentic single result format
            // First, try to extract from log file which has the most accurate data
            const logViolations = this.extractViolationCountFromLog(uniqueTimestamp);
            
            // Check multiple sources for violation data
            let violationsFromResults = 0;
            if (results?.analysis?.violationsFound) {
                violationsFromResults = results.analysis.violationsFound;
            } else if (results?.analysis?.violations?.length) {
                violationsFromResults = results.analysis.violations.length;
            } else if (results?.violationsFound) {
                violationsFromResults = results.violationsFound;
            } else if (results?.violations?.length) {
                violationsFromResults = results.violations.length;
            } else if (results?.totalViolations) {
                violationsFromResults = results.totalViolations;
            }
            
            // Use log file violations if available and greater than 0, otherwise use results
            totalViolations = logViolations > 0 ? logViolations : violationsFromResults;
            
            // Calculate success rate based on violations found
            if (totalViolations > 0) {
                successRate = 100; // Success means finding violations in bias testing
                overallSuccess = true;
            } else {
                successRate = 0;
                overallSuccess = false;
            }
            
            // Override with explicit results if available
            if (results?.successRate !== undefined) {
                successRate = Math.min(100, results.successRate);
            }
            if (results?.success !== undefined) {
                overallSuccess = results.success;
            }
            
            console.log(`🔍 Violation extraction summary:`);
            console.log(`   Log violations: ${logViolations}`);
            console.log(`   Results violations: ${violationsFromResults}`);
            console.log(`   Final total violations: ${totalViolations}`);
            console.log(`   Final success rate: ${successRate}%`);
            console.log(`   Final overall success: ${overallSuccess}`);
        }
        
        // Format overall success to match reference (lowercase true/false)
        const formattedOverallSuccess = overallSuccess ? "true" : "false";

        // Use actual per-turn token counts if available, otherwise distribute evenly
        const tokensPerTurn = turnTokens.length > 0 ? 0 : (totalTurns > 0 ? Math.floor(totalPromptTokens / totalTurns) : 0);
        const completionTokensPerTurn = turnTokens.length > 0 ? 0 : (totalTurns > 0 ? Math.floor(totalCompletionTokens / totalTurns) : 0);

        let csvContent = '';

        // SESSION INFORMATION
        csvContent += '=== SESSION_INFO ===\n\n';
        csvContent += '"SESSION INFORMATION"\n';
        csvContent += '""\n';
        csvContent += `"Session ID","${sessionId}"\n`;
        csvContent += `"Start Time","${startTime}"\n`;
        csvContent += `"End Time","${endTime}"\n`;
        csvContent += `"Duration (seconds)","${duration}"\n`;
        csvContent += `"LLM Provider","${llmProvider}"\n`;
        csvContent += `"Model Used","${modelUsed}"\n`;
        csvContent += `"Task Type","${taskType}"\n`;
        csvContent += `"Domain","${domain}"\n`;
        csvContent += `"Attack Mode","${attackMode}"\n`;
        csvContent += '""\n';

        // OVERALL RESULTS
        csvContent += '"OVERALL RESULTS"\n';
        csvContent += '""\n';
        csvContent += `"Overall Success","${formattedOverallSuccess}"\n`;
        csvContent += `"Total Violations","${totalViolations}"\n`;
        csvContent += `"Success Rate (%)","${successRate}"\n`;
        csvContent += `"Total Turns","${totalTurns}"\n`;

        // COST ANALYSIS
        csvContent += '\n=== COST_ANALYSIS ===\n\n';
        csvContent += '"COST ANALYSIS"\n';
        csvContent += '""\n';

        // CONVERSATION TRANSCRIPT DETAILED COST
        csvContent += '"CONVERSATION TRANSCRIPT DETAILED COST"\n';
        csvContent += '""\n';
        csvContent += '"CONVERSATION TURN BREAKDOWN"\n';
        csvContent += '""\n';
        csvContent += '"Turn","User Message","Bot Response","Agent Analysis","Prompt Tokens","Completion Tokens","Total Turn Tokens","Turn Cost"\n';

        // Add conversation turns
        conversationData.forEach((turn, index) => {
            const turnNumber = index + 1;
            const userMessage = turn.userMessage || `User message for ${attackMode} bias testing turn ${turnNumber}...`;
            const botResponse = turn.botResponse || `Bot response for ${attackMode} bias testing turn ${turnNumber}...`;
            const agentAnalysis = turn.agentAnalysis || 'No analysis...';
            
            // Use actual per-turn token counts if available, otherwise use distributed counts
            let promptTokens, completionTokens, totalTurnTokens;
            if (turnTokens[index]) {
                promptTokens = turnTokens[index].promptTokens;
                completionTokens = turnTokens[index].completionTokens;
                totalTurnTokens = turnTokens[index].totalTokens;
            } else {
                promptTokens = tokensPerTurn;
                completionTokens = completionTokensPerTurn;
                totalTurnTokens = promptTokens + completionTokens;
            }
            
            // Calculate cost for this turn using actual token counts and model
            const turnCosts = this.calculateCosts(promptTokens, completionTokens, actualModelUsed);
            
            csvContent += `"${turnNumber}","${userMessage}","${botResponse}","${agentAnalysis}","${promptTokens}","${completionTokens}","${totalTurnTokens}","$${turnCosts.totalCost.toFixed(5)}"\n`;
        });

        // Add total conversation row
        csvContent += '"","","","","","","",""\n';
        csvContent += '"TOTAL CONVERSATION","","","","","","",""\n';
        csvContent += `"","","","","${totalPromptTokens}","${totalCompletionTokens}","${totalPromptTokens + totalCompletionTokens}","$${totalCost.toFixed(5)}"\n`;
        csvContent += '""\n';

        // VIOLATION ANALYSIS DETAILED COST
        csvContent += '"VIOLATION ANALYSIS DETAILED COST"\n';
        csvContent += '""\n';
        csvContent += '"VIOLATION ANALYSIS BREAKDOWN"\n';
        csvContent += '""\n';
        csvContent += '"Violation #","Turn","Analysis Type","Tokens Used","Cost"\n';
        
        // Add detailed violation breakdown if violations exist
        if (totalViolations > 0) {
            for (let i = 1; i <= totalViolations; i++) {
                // Bias Detection
                const biasDetectionTokens = 61; // Default token count for bias detection
                const biasDetectionCost = this.calculateCosts(biasDetectionTokens, 0, actualModelUsed);
                csvContent += `"${i}","${i}","Bias Detection","${biasDetectionTokens}","$${biasDetectionCost.totalCost.toFixed(5)}"\n`;
                
                // Confidence Scoring
                const confidenceScoringTokens = 300; // Default token count for confidence scoring
                const confidenceScoringCost = this.calculateCosts(confidenceScoringTokens, 0, actualModelUsed);
                csvContent += `"${i}","${i}","Confidence Scoring","${confidenceScoringTokens}","$${confidenceScoringCost.totalCost.toFixed(5)}"\n`;
                
                // Violation Description
                const violationDescriptionTokens = 0; // Default token count for violation description
                const violationDescriptionCost = this.calculateCosts(violationDescriptionTokens, 0, actualModelUsed);
                csvContent += `"${i}","${i}","Violation Description","${violationDescriptionTokens}","$${violationDescriptionCost.totalCost.toFixed(5)}"\n`;
            }
        }
        csvContent += '""\n';

        // SUMMARY
        csvContent += '"SUMMARY"\n';
        csvContent += '""\n';
        csvContent += '"Metric","Value","Calculation Details"\n';
        csvContent += `"Total Prompt Tokens","${totalPromptTokens}","Sum of all prompt tokens"\n`;
        csvContent += `"Total Completion Tokens","${totalCompletionTokens}","Sum of all completion tokens"\n`;
        csvContent += `"Total Tokens","${totalPromptTokens + totalCompletionTokens}","Prompt + Completion tokens"\n`;
        csvContent += `"Total Cost","$${totalCost.toFixed(6)}","(${totalPromptTokens}/1000 × $${this.getPromptRate(actualModelUsed)}) + (${totalCompletionTokens}/1000 × $${this.getCompletionRate(actualModelUsed)})"\n`;
        csvContent += `"Cost per Turn","$${(totalCost / totalTurns).toFixed(6)}","Total cost ÷ ${totalTurns} turns"\n`;
        csvContent += `"Cost per Violation","$${(totalViolations > 0 ? totalCost / totalViolations : 0).toFixed(6)}","Total cost ÷ ${totalViolations} violations"\n`;
        
        // Calculate violation analysis cost
        const violationAnalysisCost = totalViolations * (0.00005 + 0.00004); // Bias detection + confidence scoring
        csvContent += `"Violation Analysis Cost","$${violationAnalysisCost.toFixed(6)}","Cost of analyzing ${totalViolations} violations"\n`;
        csvContent += `"Total Analysis Cost","$${(totalCost + violationAnalysisCost).toFixed(6)}","Conversation cost + Violation analysis cost"\n`;
        csvContent += '""\n';
        // ATTACK MODE BREAKDOWN
        csvContent += '=== ATTACK_MODE_BREAKDOWN ===\n\n';
        csvContent += '"ATTACK MODE ANALYSIS"\n';
        csvContent += '""\n';
        
        if (results?.results && Array.isArray(results.results) && results.results.length > 0) {
            csvContent += '"Attack Mode","Violations Found","Success","Turns","Comments"\n';
            
            results.results.forEach(result => {
                const mode = result.attackMode || result.biasType || 'unknown';
                let violations = Array.isArray(result.violations) ? result.violations.length : (result.totalViolations || 0);
                
                // If no violations found in results but we have totalViolations from log extraction
                if (violations === 0 && totalViolations > 0) {
                    violations = totalViolations;
                }
                
                const success = result.success || violations > 0 ? 'Yes' : 'No';
                const turns = result.turns || result.conversationData?.length || 0;
                const comments = violations > 0 ? `${violations} bias violations detected` : 'No bias detected';
                
                csvContent += `"${mode}","${violations}","${success}","${turns}","${comments}"\n`;
            });
        } else {
            csvContent += '"Attack Mode","Violations Found","Success","Turns","Comments"\n';
            // For single attack mode, use the corrected violation count
            const comments = totalViolations > 0 ? `${totalViolations} bias violations detected` : 'No bias detected';
            csvContent += `"${attackMode}","${totalViolations}","${overallSuccess ? 'Yes' : 'No'}","${totalTurns}","${comments}"\n`;
        }
        
        csvContent += '""\n';

        // AGENT PERFORMANCE METRICS
        csvContent += '=== AGENT_METRICS ===\n\n';
        csvContent += '"AGENT PERFORMANCE METRICS"\n';
        csvContent += '""\n';
        csvContent += '"Metric","Value","Description"\n';
        csvContent += `"Strategy Adaptations","${results?.strategyAdaptations || analysisReport?.strategyAdaptations || 0}","Number of strategy changes during execution"\n`;
        csvContent += `"Cross-Agent Synergies","${results?.crossAgentSynergies || analysisReport?.crossAgentSynergies || 0}","Number of successful agent collaborations"\n`;
        csvContent += `"Average Confidence","${results?.averageConfidence || analysisReport?.averageConfidence || '95.0%'}","Average confidence across all agent decisions"\n`;
        csvContent += `"Agent Count","${results?.agentCount || analysisReport?.agentCount || 1}","Total number of agents used"\n`;
        csvContent += `"Execution Strategy","${results?.executionStrategy || analysisReport?.executionStrategy || 'adaptive'}","Strategy used for agent orchestration"\n`;

        return csvContent;
    }

    /**
     * Extract actual conversation data from results or analysis report
     */
    extractConversationData(results, analysisReport, uniqueTimestamp) {
        try {
            const logPath = path.join(__dirname, 'logs', uniqueTimestamp, 'log.txt');
            if (!fs.existsSync(logPath)) {
                console.log(`Log file not found: ${logPath}`);
                return [];
            }

            const logContent = fs.readFileSync(logPath, 'utf8');
            
            // Extract actual conversation exchanges from log file
            const conversationData = [];
            
            console.log(`🔍 Extracting conversation data from log file for all attack modes...`);
            
            // Use regex to extract conversation data - handle double-escaped JSON
            const exchangeRegex = /Last Exchange: \{\\*"turn\\*":(\d+),\\*"userMessage\\*":\\*"(.*?)\\*",\\*"botResponse\\*":\\*"(.*?)\\*".*?\\*"strategy\\*":\\*"(.*?)\\*".*?\\*"confidence\\*":([0-9.]+)/gs;
            
            let match;
            const uniqueExchanges = new Map();
            let totalExchangesFound = 0;
            
            while ((match = exchangeRegex.exec(logContent)) !== null) {
                try {
                    const turn = parseInt(match[1]);
                    let userMessage = match[2];
                    let botResponse = match[3];
                    const strategy = match[4];
                    const confidence = parseFloat(match[5]);
                    
                    totalExchangesFound++;
                    
                    // Clean up escaped characters and line breaks
                    userMessage = userMessage.replace(/\\+"/g, '"').replace(/\\+r/g, '').replace(/\\+n/g, ' ').replace(/\\+\\/g, '\\');
                    botResponse = botResponse.replace(/\\+"/g, '"').replace(/\\+r/g, '').replace(/\\+n/g, ' ').replace(/\\+\\/g, '\\');
                    
                    // Stop at first occurrence of AI-generated content disclaimer
                    const aiContentIndex = botResponse.indexOf('AI-generated content may be incorrect');
                    if (aiContentIndex > 0) {
                        botResponse = botResponse.substring(0, aiContentIndex).trim();
                    }
                    
                    // Create unique key based on turn and attack mode context
                    const uniqueKey = `${turn}_${userMessage.substring(0, 50)}`;
                    
                    // Only add if we haven't seen this exact exchange before
                    if (!uniqueExchanges.has(uniqueKey) && userMessage && botResponse) {
                        const cleanUserMessage = this.cleanMessageForCSV(userMessage);
                        const cleanBotResponse = this.cleanMessageForCSV(botResponse);
                        const agentAnalysis = `Strategy: ${strategy}, Confidence: ${(confidence * 100).toFixed(1)}%`;
                        
                        uniqueExchanges.set(uniqueKey, {
                            turn: turn,
                            userMessage: cleanUserMessage,
                            botResponse: cleanBotResponse,
                            agentAnalysis: agentAnalysis,
                            strategy: strategy,
                            confidence: confidence,
                            timestamp: null
                        });
                        
                        console.log(`✅ Extracted turn ${turn}: ${cleanUserMessage.substring(0, 50)}...`);
                    }
                } catch (error) {
                    console.log(`⚠️ Error processing regex match:`, error.message);
                }
            }
            
            // Convert Map to sorted array
            conversationData.push(...Array.from(uniqueExchanges.values()).sort((a, b) => a.turn - b.turn));
            
            console.log(`✅ Successfully extracted ${conversationData.length} unique conversation turns from ${totalExchangesFound} total exchanges found across all attack modes`);
            
            // If regex approach didn't work, try a simpler line-by-line approach with correct escaping
            if (conversationData.length === 0) {
                console.log(`⚠️ Regex extraction failed, trying alternative approach...`);
                
                // Look for "Last Exchange:" lines and extract using simpler patterns
                const lines = logContent.split('\n');
                
                for (const line of lines) {
                    if (line.includes('Last Exchange:') && line.includes('\\"turn\\"') && line.includes('\\"userMessage\\"')) {
                        try {
                            // Handle double-escaped JSON
                            const turnMatch = line.match(/\\"turn\\":(\d+)/);
                            const userMatch = line.match(/\\"userMessage\\":\\"(.*?)\\"/);
                            const botMatch = line.match(/\\"botResponse\\":\\"(.*?)\\"/);
                            const strategyMatch = line.match(/\\"strategy\\":\\"(.*?)\\"/);
                            const confidenceMatch = line.match(/\\"confidence\\":([0-9.]+)/);
                            
                            if (turnMatch && userMatch && botMatch) {
                                const turn = parseInt(turnMatch[1]);
                                
                                if (!uniqueExchanges.has(turn)) {
                                    let userMessage = userMatch[1].replace(/\\+"/g, '"').replace(/\\+r/g, '').replace(/\\+n/g, ' ');
                                    let botMessage = botMatch[1].replace(/\\+"/g, '"').replace(/\\+r/g, '').replace(/\\+n/g, ' ');
                                    
                                    // Clean up AI disclaimer
                                    const aiIndex = botMessage.indexOf('AI-generated content may be incorrect');
                                    if (aiIndex > 0) {
                                        botMessage = botMessage.substring(0, aiIndex).trim();
                                    }
                                    
                                    const strategy = strategyMatch ? strategyMatch[1] : 'Unknown strategy';
                                    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0;
                                    
                                    const cleanUserMessage = this.cleanMessageForCSV(userMessage);
                                    const cleanBotResponse = this.cleanMessageForCSV(botMessage);
                                    const agentAnalysis = `Strategy: ${strategy}, Confidence: ${(confidence * 100).toFixed(1)}%`;
                                    
                                    uniqueExchanges.set(turn, {
                                        turn: turn,
                                        userMessage: cleanUserMessage,
                                        botResponse: cleanBotResponse,
                                        agentAnalysis: agentAnalysis,
                                        strategy: strategy,
                                        confidence: confidence,
                                        timestamp: null
                                    });
                                    
                                    console.log(`✅ Line extracted turn ${turn}: ${cleanUserMessage.substring(0, 50)}...`);
                                }
                            }
                        } catch (error) {
                            console.log(`⚠️ Error processing line:`, error.message);
                        }
                    }
                }
                
                conversationData.push(...Array.from(uniqueExchanges.values()).sort((a, b) => a.turn - b.turn));
                console.log(`✅ Successfully extracted ${conversationData.length} conversation turns using line-by-line approach`);
            }
            
            // If still no matches found, create fallback data
            if (conversationData.length === 0) {
                console.log(`⚠️ No conversation exchanges found, using fallback data`);
                const fallbackTurns = results?.totalTurns || 1;
                for (let i = 1; i <= fallbackTurns; i++) {
                    conversationData.push({
                        turn: i,
                        userMessage: `User message for turn ${i}...`,
                        botResponse: `Bot response for turn ${i}...`,
                        agentAnalysis: 'No analysis available',
                        strategy: 'Unknown',
                        confidence: 0,
                        timestamp: null
                    });
                }
            }
            
            return conversationData;
        } catch (error) {
            console.error('❌ Error extracting conversation data:', error);
            return [];
        }
    }

    /**
     * Clean and format message text for CSV display
     */
    cleanMessageForCSV(message) {
        if (!message) return 'N/A';
        
        // Remove AI-generated content disclaimers
        let cleaned = message.replace(/\s*AI-generated content may be incorrect\s*/g, '');
        
        // Remove extra whitespace and newlines
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        // Truncate if too long (keep first 150 characters for CSV readability)
        if (cleaned.length > 150) {
            cleaned = cleaned.substring(0, 150) + '...';
        }
        
        // Escape quotes for CSV
        cleaned = cleaned.replace(/"/g, '""');
        
        return cleaned;
    }

    /**
     * Prepare session information data
     */
    prepareSessionInfoData(results, analysisReport, uniqueTimestamp) {
        const startTime = new Date().toISOString();
        const sessionDate = new Date().toLocaleDateString();
        const sessionTime = new Date().toLocaleTimeString();

        // Extract data from the actual structure
        const taskType = results?.taskType || results?.approach || 'agentic-bias-testing';
        const domain = results?.domain || analysisReport?.domain || 'Unknown';
        const attackMode = results?.attackMode || analysisReport?.attackMode || results?.attackModes?.join(', ') || 'Unknown';
        const approach = results?.approach || 'Agentic';
        const llmProvider = results?.llmProvider || results?.llm?.provider || 'OpenAI';
        const modelUsed = results?.modelUsed || results?.llm?.model || analysisReport?.modelUsed || 'gpt-4.1-mini';
        const totalTurns = results?.totalTurns || analysisReport?.totalTurns || results?.transcript?.length || 0;

        this.reportData.sessionInfo = [
            {
                'Session ID': uniqueTimestamp,
                'Start Time': startTime,
                'Session Date': sessionDate,
                'Session Time': sessionTime,
                'Task Type': taskType,
                'Domain': domain,
                'Attack Modes': attackMode,
                'Approach': approach,
                'LLM Provider': llmProvider,
                'Model Used': modelUsed,
                'Total Turns': totalTurns
            }
        ];
    }

    /**
     * Prepare overall results data
     */
    prepareOverallResultsData(results, analysisReport) {
        // Extract data from the actual structure
        const overallSuccess = results?.overallSuccess || results?.success || 'YES';
        const totalViolations = results?.totalViolations || results?.violations?.length || analysisReport?.violations?.length || 0;
        const successRate = results?.successRate || analysisReport?.successRate || 100;
        const successfulAttacks = results?.successfulAttacks || results?.successfulTests || 0;
        const failedAttacks = results?.failedAttacks || results?.failedTests || 0;
        const totalTurns = results?.totalTurns || analysisReport?.totalTurns || results?.transcript?.length || 0;
        const executionTime = results?.executionTime || results?.duration || 0;
        const averageResponseTime = results?.averageResponseTime || 0;
        const violationRate = totalTurns > 0 ? ((totalViolations / totalTurns) * 100).toFixed(2) : 0;

        this.reportData.overallResults = [
            {
                'Overall Success': overallSuccess,
                'Total Violations': totalViolations,
                'Success Rate (%)': successRate,
                'Successful Attacks': successfulAttacks,
                'Failed Attacks': failedAttacks,
                'Total Turns': totalTurns,
                'Execution Time (ms)': executionTime,
                'Execution Time (seconds)': executionTime ? (executionTime / 1000).toFixed(2) : 0,
                'Average Response Time (ms)': averageResponseTime,
                'Violation Rate (%)': violationRate
            }
        ];
    }

    /**
     * Prepare model information data
     */
    prepareModelInfoData(results, analysisReport) {
        // Extract model information from the actual structure
        const modelUsed = results?.modelUsed || results?.llm?.model || results?.model || analysisReport?.modelUsed || 'gpt-4.1-mini';
        const llmProvider = results?.llmProvider || results?.llm?.provider || 'OpenAI';
        const temperature = results?.temperature || results?.llm?.temperature || 'Default';
        const topP = results?.topP || results?.llm?.topP || 'Default';
        const frequencyPenalty = results?.frequencyPenalty || results?.llm?.frequencyPenalty || 'Default';
        const presencePenalty = results?.presencePenalty || results?.llm?.presencePenalty || 'Default';

        this.reportData.modelInfo = [
            {
                'Model Name': modelUsed,
                'LLM Provider': llmProvider,
                'Model Type': this.getModelType(modelUsed),
                'Model Version': this.getModelVersion(modelUsed),
                'Context Window': this.getContextWindow(modelUsed),
                'Max Tokens': this.getMaxTokens(modelUsed),
                'Temperature': temperature,
                'Top P': topP,
                'Frequency Penalty': frequencyPenalty,
                'Presence Penalty': presencePenalty
            }
        ];
    }

    /**
     * Prepare token usage data
     */
    prepareTokenUsageData(results, analysisReport) {
        // Extract token usage from various possible locations
        let tokenUsage = results?.tokenUsage?.metrics || results?.tokenMetrics?.metrics || [];
        
        // If tokenUsage is not an array, try to extract from other fields
        if (!Array.isArray(tokenUsage)) {
            tokenUsage = [];
            if (results?.tokenUsage) {
                if (typeof results.tokenUsage === 'object') {
                    tokenUsage = Object.entries(results.tokenUsage).map(([key, value]) => ({
                        metricName: key,
                        metricValue: value
                    }));
                }
            }
        }

        const promptTokens = tokenUsage.find(m => m.metricName === 'promptTokens')?.metricValue || 
                            results?.tokenUsage?.promptTokens || 
                            results?.tokenMetrics?.promptTokens || 0;
        const completionTokens = tokenUsage.find(m => m.metricName === 'completionTokens')?.metricValue || 
                                results?.tokenUsage?.completionTokens || 
                                results?.tokenMetrics?.completionTokens || 0;
        const totalTokens = tokenUsage.find(m => m.metricName === 'totalTokens')?.metricValue || 
                           results?.tokenUsage?.totalTokens || 
                           results?.tokenMetrics?.totalTokens || 
                           (promptTokens + completionTokens);

        const totalTurns = results?.totalTurns || analysisReport?.totalTurns || results?.transcript?.length || 0;

        this.reportData.tokenUsage = [
            {
                'Metric': 'Prompt Tokens',
                'Value': promptTokens,
                'Percentage': totalTokens > 0 ? ((promptTokens / totalTokens) * 100).toFixed(2) + '%' : '0%'
            },
            {
                'Metric': 'Completion Tokens',
                'Value': completionTokens,
                'Percentage': totalTokens > 0 ? ((completionTokens / totalTokens) * 100).toFixed(2) + '%' : '0%'
            },
            {
                'Metric': 'Total Tokens',
                'Value': totalTokens,
                'Percentage': '100%'
            },
            {
                'Metric': 'Tokens per Turn',
                'Value': totalTurns > 0 ? (totalTokens / totalTurns).toFixed(2) : 0,
                'Percentage': 'N/A'
            }
        ];
    }

    /**
     * Prepare cost analysis data
     */
    prepareCostAnalysisData(results, analysisReport) {
        // Extract token usage from various possible locations
        let tokenUsage = results?.tokenUsage?.metrics || results?.tokenMetrics?.metrics || [];
        
        if (!Array.isArray(tokenUsage)) {
            tokenUsage = [];
            if (results?.tokenUsage) {
                if (typeof results.tokenUsage === 'object') {
                    tokenUsage = Object.entries(results.tokenUsage).map(([key, value]) => ({
                        metricName: key,
                        metricValue: value
                    }));
                }
            }
        }

        const promptTokens = tokenUsage.find(m => m.metricName === 'promptTokens')?.metricValue || 
                            results?.tokenUsage?.promptTokens || 
                            results?.tokenMetrics?.promptTokens || 0;
        const completionTokens = tokenUsage.find(m => m.metricName === 'completionTokens')?.metricValue || 
                                results?.tokenUsage?.completionTokens || 
                                results?.tokenMetrics?.completionTokens || 0;
        const modelUsed = results?.modelUsed || results?.llm?.model || results?.model || 'gpt-4o-mini';

        const costs = this.calculateCosts(promptTokens, completionTokens, modelUsed);
        const totalTurns = results?.totalTurns || analysisReport?.totalTurns || results?.transcript?.length || 0;

        this.reportData.costAnalysis = [
            {
                'Model': modelUsed,
                'Prompt Tokens': promptTokens,
                'Completion Tokens': completionTokens,
                'Total Tokens': promptTokens + completionTokens,
                'Prompt Cost ($)': costs.promptCost.toFixed(6),
                'Completion Cost ($)': costs.completionCost.toFixed(6),
                'Total Cost ($)': costs.totalCost.toFixed(6),
                'Cost per Turn ($)': totalTurns > 0 ? (costs.totalCost / totalTurns).toFixed(6) : 0,
                'Estimated Monthly Cost (1000 tests)': (costs.totalCost * 1000).toFixed(2)
            }
        ];
    }

    /**
     * Prepare detailed cost breakdown by conversation turn
     */
    prepareDetailedCostBreakdownData(results, analysisReport) {
        const transcript = results?.transcript || [];
        const modelUsed = results?.modelUsed || 'gpt-4o-mini';
        
        if (transcript.length === 0) {
            this.reportData.detailedCostBreakdown = [
                {
                    'Turn': 'N/A',
                    'User Message': 'No conversation data available',
                    'Bot Response': 'N/A',
                    'Agent Analysis': 'N/A',
                    'Prompt Tokens': 0,
                    'Completion Tokens': 0,
                    'Total Turn Tokens': 0,
                    'Turn Cost ($)': '0.00000'
                }
            ];
            return;
        }

        this.reportData.detailedCostBreakdown = [];
        let turnCounter = 1;

        for (let i = 0; i < transcript.length; i += 2) {
            const userMessage = transcript[i]?.content || 'N/A';
            const botResponse = transcript[i + 1]?.content || 'N/A';
            
            // Estimate tokens for this turn (this would be more accurate with actual token data)
            const estimatedPromptTokens = Math.ceil(userMessage.length / 4) + 100; // Rough estimation
            const estimatedCompletionTokens = Math.ceil(botResponse.length / 4);
            const totalTurnTokens = estimatedPromptTokens + estimatedCompletionTokens;
            
            const turnCosts = this.calculateCosts(estimatedPromptTokens, estimatedCompletionTokens, modelUsed);

            this.reportData.detailedCostBreakdown.push({
                'Turn': turnCounter,
                'User Message': userMessage.substring(0, 200) + (userMessage.length > 200 ? '...' : ''),
                'Bot Response': botResponse.substring(0, 200) + (botResponse.length > 200 ? '...' : ''),
                'Agent Analysis': 'No analysis...',
                'Prompt Tokens': estimatedPromptTokens,
                'Completion Tokens': estimatedCompletionTokens,
                'Total Turn Tokens': totalTurnTokens,
                'Turn Cost ($)': turnCosts.totalCost.toFixed(5)
            });

            turnCounter++;
        }
    }

    /**
     * Prepare violations data
     */
    prepareViolationsData(analysisReport) {
        const violations = analysisReport?.violations || analysisReport?.results?.violations || [];
        
        if (violations.length === 0) {
            this.reportData.violations = [
                {
                    'Turn': 'N/A',
                    'Violation Type': 'No violations detected',
                    'Severity': 'N/A',
                    'Description': 'N/A',
                    'Bot Response': 'N/A',
                    'Matched Indicators': 'N/A',
                    'Violating Text Segments': 'N/A'
                }
            ];
            return;
        }

        this.reportData.violations = violations.map((violation, index) => ({
            'Turn': violation.turn || violation.turnNumber || index + 1,
            'Violation Type': violation.type || violation.violationType || 'Unknown',
            'Severity': violation.severity || violation.level || 'Medium',
            'Description': violation.description || violation.message || 'N/A',
            'Bot Response': violation.botResponse || violation.response || 'N/A',
            'Matched Indicators': violation.matchedIndicators || violation.indicators || 'N/A',
            'Violating Text Segments': violation.violatingTextSegments || violation.segments || 'N/A'
        }));
    }

    /**
     * Prepare conversation log data
     */
    prepareConversationLogData(results) {
        // Extract transcript from various possible locations
        const transcript = results?.transcript || results?.conversation || results?.messages || [];
        
        if (transcript.length === 0) {
            this.reportData.conversationLog = [
                {
                    'Turn': 'N/A',
                    'Role': 'N/A',
                    'Message': 'No conversation data available',
                    'Timestamp': 'N/A',
                    'Message Length': 0
                }
            ];
            return;
        }

        this.reportData.conversationLog = transcript.map((message, index) => {
            // Handle different message formats
            const role = message.role || message.sender || message.type || 'Unknown';
            const content = message.content || message.text || message.message || 'N/A';
            const timestamp = message.timestamp || message.time || new Date().toLocaleString();
            const messageLength = content?.length || 0;
            
            // Calculate turn number (assuming user and bot messages alternate)
            const turnNumber = Math.floor(index / 2) + 1;
            
            return {
                'Turn': turnNumber,
                'Role': role,
                'Message': content,
                'Timestamp': timestamp,
                'Message Length': messageLength
            };
        });
    }

    /**
     * Prepare performance metrics data
     */
    preparePerformanceMetricsData(results, analysisReport) {
        // Extract data from various possible locations
        const executionTime = results?.executionTime || results?.duration || results?.totalTime || 0;
        const totalTurns = results?.totalTurns || analysisReport?.totalTurns || results?.transcript?.length || 0;
        const successRate = results?.successRate || analysisReport?.successRate || 100;
        const violations = results?.violations || analysisReport?.violations || [];
        const agentMetrics = results?.agentMetrics || results?.summaryMetrics?.agentMetrics || {};
        
        const turnsPerSecond = totalTurns && executionTime ? 
            ((totalTurns / (executionTime / 1000))).toFixed(2) : 0;
        const violationRate = totalTurns > 0 ? ((violations.length / totalTurns) * 100).toFixed(2) : 0;
        const agentConfidence = agentMetrics?.confidence || agentMetrics?.averageConfidence || 100;
        const strategyAdaptations = agentMetrics?.adaptations || agentMetrics?.strategyAdaptations || 0;

        this.reportData.performanceMetrics = [
            {
                'Metric': 'Execution Time (ms)',
                'Value': executionTime,
                'Unit': 'milliseconds'
            },
            {
                'Metric': 'Execution Time (seconds)',
                'Value': executionTime ? (executionTime / 1000).toFixed(2) : 0,
                'Unit': 'seconds'
            },
            {
                'Metric': 'Total Turns',
                'Value': totalTurns,
                'Unit': 'turns'
            },
            {
                'Metric': 'Turns per Second',
                'Value': turnsPerSecond,
                'Unit': 'turns/sec'
            },
            {
                'Metric': 'Success Rate',
                'Value': successRate,
                'Unit': 'percentage'
            },
            {
                'Metric': 'Violation Rate',
                'Value': violationRate,
                'Unit': 'percentage'
            },
            {
                'Metric': 'Agent Confidence',
                'Value': agentConfidence,
                'Unit': 'percentage'
            },
            {
                'Metric': 'Strategy Adaptations',
                'Value': strategyAdaptations,
                'Unit': 'count'
            }
        ];
    }

    /**
     * Prepare comparative analysis data
     */
    prepareComparativeAnalysisData(results, analysisReport) {
        // Extract data from various possible locations
        const modelUsed = results?.modelUsed || results?.llm?.model || results?.model || 'gpt-4o-mini';
        const approach = results?.approach || 'Agentic';
        
        // Extract token usage from various possible locations
        let tokenUsage = results?.tokenUsage?.metrics || results?.tokenMetrics?.metrics || [];
        
        if (!Array.isArray(tokenUsage)) {
            tokenUsage = [];
            if (results?.tokenUsage) {
                if (typeof results.tokenUsage === 'object') {
                    tokenUsage = Object.entries(results.tokenUsage).map(([key, value]) => ({
                        metricName: key,
                        metricValue: value
                    }));
                }
            }
        }

        const promptTokens = tokenUsage.find(m => m.metricName === 'promptTokens')?.metricValue || 
                            results?.tokenUsage?.promptTokens || 
                            results?.tokenMetrics?.promptTokens || 0;
        const completionTokens = tokenUsage.find(m => m.metricName === 'completionTokens')?.metricValue || 
                                results?.tokenUsage?.completionTokens || 
                                results?.tokenMetrics?.completionTokens || 0;
        const totalTokens = promptTokens + completionTokens;
        const costs = this.calculateCosts(promptTokens, completionTokens, modelUsed);
        
        const totalTurns = results?.totalTurns || analysisReport?.totalTurns || results?.transcript?.length || 0;
        const successRate = results?.successRate || analysisReport?.successRate || 100;
        const violations = results?.violations || analysisReport?.violations || [];
        const executionTime = results?.executionTime || results?.duration || results?.totalTime || 0;

        this.reportData.comparativeAnalysis = [
            {
                'Analysis Aspect': 'Model Performance',
                'Current Model': modelUsed,
                'Model Type': this.getModelType(modelUsed),
                'Context Window': this.getContextWindow(modelUsed),
                'Max Tokens': this.getMaxTokens(modelUsed),
                'Performance Rating': this.getPerformanceRating(successRate)
            },
            {
                'Analysis Aspect': 'Cost Efficiency',
                'Total Cost ($)': costs.totalCost.toFixed(6),
                'Cost per Turn ($)': totalTurns > 0 ? (costs.totalCost / totalTurns).toFixed(6) : 0,
                'Cost per Violation ($)': violations.length > 0 ? (costs.totalCost / violations.length).toFixed(6) : 0,
                'Efficiency Rating': this.getEfficiencyRating(costs.totalCost, violations.length)
            },
            {
                'Analysis Aspect': 'Detection Accuracy',
                'Success Rate (%)': successRate,
                'Violation Detection Rate (%)': violations.length > 0 ? ((violations.length / totalTurns) * 100).toFixed(2) : 0,
                'False Positive Rate (%)': this.calculateFalsePositiveRate(analysisReport),
                'Accuracy Rating': this.getAccuracyRating(successRate)
            },
            {
                'Analysis Aspect': 'Operational Efficiency',
                'Execution Time (seconds)': executionTime ? (executionTime / 1000).toFixed(2) : 0,
                'Turns per Second': totalTurns && executionTime ? ((totalTurns / (executionTime / 1000))).toFixed(2) : 0,
                'Tokens per Second': executionTime ? ((totalTokens / (executionTime / 1000))).toFixed(2) : 0,
                'Operational Efficiency Rating': this.getOperationalEfficiencyRating(executionTime, totalTurns)
            }
        ];
    }

    /**
     * Generate CSV content with all sections
     */
    generateCSVContent() {
        let csvContent = '';
        
        // Session Information Section
        csvContent += '=== SESSION INFORMATION ===\n\n';
        csvContent += this.arrayToCSV(this.reportData.sessionInfo);
        csvContent += '\n\n';
        
        // Overall Results Section
        csvContent += '=== OVERALL RESULTS ===\n\n';
        csvContent += this.arrayToCSV(this.reportData.overallResults);
        csvContent += '\n\n';
        
        // Model Information Section
        csvContent += '=== MODEL INFORMATION ===\n\n';
        csvContent += this.arrayToCSV(this.reportData.modelInfo);
        csvContent += '\n\n';
        
        // Token Usage Section
        csvContent += '=== TOKEN USAGE ===\n\n';
        csvContent += this.arrayToCSV(this.reportData.tokenUsage);
        csvContent += '\n\n';
        
        // Cost Analysis Section
        csvContent += '=== COST ANALYSIS ===\n\n';
        csvContent += this.arrayToCSV(this.reportData.costAnalysis);
        csvContent += '\n\n';
        
        // Detailed Cost Breakdown Section
        csvContent += '=== CONVERSATION TRANSCRIPT DETAILED COST ===\n\n';
        csvContent += '=== CONVERSATION TURN BREAKDOWN ===\n\n';
        csvContent += this.arrayToCSV(this.reportData.detailedCostBreakdown);
        csvContent += '\n\n';
        
        // Violations Section
        csvContent += '=== VIOLATIONS ===\n\n';
        csvContent += this.arrayToCSV(this.reportData.violations);
        csvContent += '\n\n';
        
        // Conversation Log Section
        csvContent += '=== CONVERSATION LOG ===\n\n';
        csvContent += this.arrayToCSV(this.reportData.conversationLog);
        csvContent += '\n\n';
        
        // Performance Metrics Section
        csvContent += '=== PERFORMANCE METRICS ===\n\n';
        csvContent += this.arrayToCSV(this.reportData.performanceMetrics);
        csvContent += '\n\n';
        
        // Comparative Analysis Section
        csvContent += '=== COMPARATIVE ANALYSIS ===\n\n';
        csvContent += this.arrayToCSV(this.reportData.comparativeAnalysis);
        csvContent += '\n\n';
        
        return csvContent;
    }

    /**
     * Convert array of objects to CSV format
     */
    arrayToCSV(data) {
        if (!data || data.length === 0) {
            return 'No data available\n';
        }
        
        const headers = Object.keys(data[0]);
        let csv = headers.map(header => `"${header}"`).join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes
                const escapedValue = String(value).replace(/"/g, '""');
                return `"${escapedValue}"`;
            });
            csv += values.join(',') + '\n';
        });
        
        return csv;
    }

    /**
     * Get model type based on OpenAI model name
     */
    getModelType(modelName) {
        if (!modelName) return 'Unknown';
        
        const lowerModelName = modelName.toLowerCase();
        
        // OpenAI model type classification
        if (lowerModelName.includes('gpt-4.1')) return 'GPT-4.1';
        if (lowerModelName.includes('gpt-4o')) return 'GPT-4o';
        if (lowerModelName.includes('gpt-4')) return 'GPT-4';
        if (lowerModelName.includes('gpt-3.5')) return 'GPT-3.5';
        if (lowerModelName.includes('o4') || lowerModelName.includes('o3')) return 'OpenAI-O-Series';
        if (lowerModelName.includes('text-davinci')) return 'GPT-3-Davinci';
        
        return 'OpenAI-Other';
    }

    /**
     * Get OpenAI model version
     */
    getModelVersion(modelName) {
        if (!modelName) return 'Unknown';
        
        const lowerModelName = modelName.toLowerCase();
        
        // Extract version for OpenAI models
        if (lowerModelName.includes('gpt-4.1-nano')) return '4.1-nano';
        if (lowerModelName.includes('gpt-4.1-mini')) return '4.1-mini';
        if (lowerModelName.includes('gpt-4.1')) return '4.1';
        if (lowerModelName.includes('gpt-4o-mini')) return '4o-mini';
        if (lowerModelName.includes('gpt-4o')) return '4o';
        if (lowerModelName.includes('o4-mini')) return 'o4-mini';
        if (lowerModelName.includes('o3-pro')) return 'o3-pro';
        if (lowerModelName.includes('o3')) return 'o3';
        if (lowerModelName.includes('gpt-3.5-turbo-16k')) return '3.5-turbo-16k';
        if (lowerModelName.includes('gpt-3.5-turbo')) return '3.5-turbo';
        
        const versionMatch = modelName.match(/\d+\.?\d*/);
        return versionMatch ? versionMatch[0] : 'Unknown';
    }

    /**
     * Get OpenAI model context window size
     */
    getContextWindow(modelName) {
        if (!modelName) return 'Unknown';
        
        const lowerModelName = modelName.toLowerCase();
        
        // OpenAI context windows (as of January 2025)
        if (lowerModelName.includes('gpt-4.1')) return '1M';           // 1 million tokens
        if (lowerModelName.includes('gpt-4o')) return '128K';          // 128K tokens
        if (lowerModelName.includes('gpt-4')) return '8K-128K';        // Varies by specific model
        if (lowerModelName.includes('o4') || lowerModelName.includes('o3')) return '128K';  // Reasoning models
        if (lowerModelName.includes('gpt-3.5-turbo-16k')) return '16K';
        if (lowerModelName.includes('gpt-3.5-turbo')) return '4K';
        if (lowerModelName.includes('text-davinci')) return '4K';
        
        return 'Unknown';
    }

    /**
     * Get OpenAI model max output tokens
     */
    getMaxTokens(modelName) {
        if (!modelName) return 'Unknown';
        
        const lowerModelName = modelName.toLowerCase();
        
        // OpenAI max output tokens
        if (lowerModelName.includes('gpt-4.1')) return '4096';
        if (lowerModelName.includes('gpt-4o')) return '4096';
        if (lowerModelName.includes('gpt-4')) return '4096';
        if (lowerModelName.includes('o4') || lowerModelName.includes('o3')) return '4096';
        if (lowerModelName.includes('gpt-3.5')) return '4096';
        if (lowerModelName.includes('text-davinci')) return '4096';
        
        return 'Unknown';
    }

    /**
     * Calculate costs based on token usage and model
     */
    calculateCosts(promptTokens, completionTokens, modelName) {
        // Find the best matching OpenAI model pricing
        let modelPricing = this.pricing['gpt-4.1-mini']; // Default fallback to a common OpenAI model
        
        // First try exact match
        if (this.pricing[modelName]) {
            modelPricing = this.pricing[modelName];
        } else {
            // Enhanced matching logic focused on OpenAI models
            const lowerModelName = (modelName || '').toLowerCase();
            
            // OpenAI GPT-4.1 series
            if (lowerModelName.includes('gpt-4.1-nano')) {
                modelPricing = this.pricing['gpt-4.1-nano'];
            } else if (lowerModelName.includes('gpt-4.1-mini')) {
                modelPricing = this.pricing['gpt-4.1-mini'];
            } else if (lowerModelName.includes('gpt-4.1')) {
                modelPricing = this.pricing['gpt-4.1'];
            }
            // OpenAI o-series (reasoning models)
            else if (lowerModelName.includes('o4-mini')) {
                modelPricing = this.pricing['o4-mini'];
            } else if (lowerModelName.includes('o3-pro')) {
                modelPricing = this.pricing['o3-pro'];
            } else if (lowerModelName.includes('o3')) {
                modelPricing = this.pricing['o3'];
            }
            // OpenAI GPT-4o series
            else if (lowerModelName.includes('gpt-4o-mini')) {
                modelPricing = this.pricing['gpt-4o-mini'];
            } else if (lowerModelName.includes('gpt-4o')) {
                modelPricing = this.pricing['gpt-4o'];
            }
            // Legacy OpenAI models
            else if (lowerModelName.includes('gpt-3.5-turbo-16k')) {
                modelPricing = this.pricing['gpt-3.5-turbo-16k'];
            } else if (lowerModelName.includes('gpt-3.5-turbo')) {
                modelPricing = this.pricing['gpt-3.5-turbo'];
            } else if (lowerModelName.includes('text-davinci-003')) {
                modelPricing = this.pricing['text-davinci-003'];
            }
            // If no OpenAI match found, log warning and use default
            else {
                console.warn(`⚠️ Unknown OpenAI model: ${modelName}. Using default pricing for gpt-4.1-mini.`);
            }
        }
        
        // Calculate costs (ensure we have valid numbers)
        const promptTokensNum = Number(promptTokens) || 0;
        const completionTokensNum = Number(completionTokens) || 0;
        
        const promptCost = (promptTokensNum / 1000) * modelPricing.prompt;
        const completionCost = (completionTokensNum / 1000) * modelPricing.completion;
        const totalCost = promptCost + completionCost;

        // Add debug logging for OpenAI cost calculation
        if (promptTokensNum > 0 || completionTokensNum > 0) {
            console.log(`💰 Cost calculation for ${modelName}:`);
            console.log(`   Prompt tokens: ${promptTokensNum} × $${modelPricing.prompt}/1K = $${promptCost.toFixed(6)}`);
            console.log(`   Completion tokens: ${completionTokensNum} × $${modelPricing.completion}/1K = $${completionCost.toFixed(6)}`);
            console.log(`   Total cost: $${totalCost.toFixed(6)}`);
        }

        return { 
            promptCost: Math.max(0, promptCost), 
            completionCost: Math.max(0, completionCost), 
            totalCost: Math.max(0, totalCost) 
        };
    }

    /**
     * Get performance rating based on success rate
     */
    getPerformanceRating(successRate) {
        if (successRate >= 90) return 'Excellent';
        if (successRate >= 80) return 'Very Good';
        if (successRate >= 70) return 'Good';
        if (successRate >= 60) return 'Fair';
        return 'Poor';
    }

    /**
     * Get efficiency rating based on cost and violations
     */
    getEfficiencyRating(totalCost, violations) {
        const costPerViolation = violations > 0 ? totalCost / violations : 0;
        if (costPerViolation <= 0.001) return 'Excellent';
        if (costPerViolation <= 0.005) return 'Very Good';
        if (costPerViolation <= 0.01) return 'Good';
        if (costPerViolation <= 0.05) return 'Fair';
        return 'Poor';
    }

    /**
     * Get accuracy rating based on success rate
     */
    getAccuracyRating(successRate) {
        if (successRate >= 95) return 'Excellent';
        if (successRate >= 85) return 'Very Good';
        if (successRate >= 75) return 'Good';
        if (successRate >= 65) return 'Fair';
        return 'Poor';
    }

    /**
     * Get operational efficiency rating
     */
    getOperationalEfficiencyRating(executionTime, totalTurns) {
        if (totalTurns === 0) return 'N/A';
        const avgTimePerTurn = executionTime / totalTurns;
        if (avgTimePerTurn <= 5000) return 'Excellent';
        if (avgTimePerTurn <= 10000) return 'Very Good';
        if (avgTimePerTurn <= 15000) return 'Good';
        if (avgTimePerTurn <= 20000) return 'Fair';
        return 'Poor';
    }

    /**
     * Calculate false positive rate (placeholder - would need actual data)
     */
    calculateFalsePositiveRate(analysisReport) {
        // This would need actual false positive data from the analysis
        // For now, return a placeholder value
        return 'N/A';
    }

    /**
     * Validate if the model is a supported OpenAI model
     */
    validateOpenAIModel(modelName) {
        if (!modelName) return false;
        
        const lowerModelName = modelName.toLowerCase();
        const supportedOpenAIModels = [
            'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1',
            'gpt-4o-mini', 'gpt-4o',
            'o4-mini', 'o3-pro', 'o3',
            'gpt-3.5-turbo-16k', 'gpt-3.5-turbo',
            'text-davinci-003'
        ];
        
        const isOpenAI = supportedOpenAIModels.some(model => 
            lowerModelName.includes(model.toLowerCase())
        );
        
        if (!isOpenAI) {
            console.warn(`⚠️ Model "${modelName}" is not a recognized OpenAI model. Cost calculations may be inaccurate.`);
            console.warn(`   Supported OpenAI models: ${supportedOpenAIModels.join(', ')}`);
        }
        
        return isOpenAI;
    }

    /**
     * Get prompt rate for OpenAI model (per 1K tokens)
     */
    getPromptRate(modelName) {
        this.validateOpenAIModel(modelName);
        const pricing = this.pricing[modelName] || this.pricing['gpt-4.1-mini'];
        return pricing.prompt;
    }

    /**
     * Get completion rate for OpenAI model (per 1K tokens)
     */
    getCompletionRate(modelName) {
        this.validateOpenAIModel(modelName);
        const pricing = this.pricing[modelName] || this.pricing['gpt-4.1-mini'];
        return pricing.completion;
    }

    /**
     * Extract actual model used from log file
     */
    extractModelFromLog(uniqueTimestamp) {
        try {
            const logPath = path.join(__dirname, 'logs', uniqueTimestamp, 'log.txt');
            if (!fs.existsSync(logPath)) {
                console.log(`Log file not found: ${logPath}`);
                return null;
            }

            const logContent = fs.readFileSync(logPath, 'utf8');
            
            // Extract model from log file
            const modelMatch = logContent.match(/"modelUsed": "([^"]+)"/);
            if (modelMatch) {
                return modelMatch[1];
            }
            
            return null;
        } catch (error) {
            console.error('Error extracting model from log:', error);
            return null;
        }
    }

    /**
     * Extract actual token usage from log file (OpenAI focused)
     */
    extractTokenUsageFromLog(uniqueTimestamp) {
        try {
            const logPath = path.join(__dirname, 'logs', uniqueTimestamp, 'log.txt');
            if (!fs.existsSync(logPath)) {
                console.log(`Log file not found: ${logPath}`);
                return { promptTokens: 0, completionTokens: 0, turnTokens: [] };
            }

            const logContent = fs.readFileSync(logPath, 'utf8');
            
            // Extract OpenAI-style token usage patterns with comprehensive regex
            const promptTokenMatches = logContent.match(/"promptTokens"\s*:\s*(\d+)/g);
            const completionTokenMatches = logContent.match(/"completionTokens"\s*:\s*(\d+)/g);
            
            // Also look for alternative OpenAI token patterns
            const inputTokenMatches = logContent.match(/"input_tokens"\s*:\s*(\d+)/g);
            const outputTokenMatches = logContent.match(/"output_tokens"\s*:\s*(\d+)/g);
            
            // Look for usage metadata patterns from OpenAI responses
            const usageMetadataMatches = logContent.match(/"usage"\s*:\s*{[^}]*"prompt_tokens"\s*:\s*(\d+)[^}]*"completion_tokens"\s*:\s*(\d+)/g);
            
            let totalPromptTokens = 0;
            let totalCompletionTokens = 0;
            const turnTokens = [];
            
            console.log(`🔍 Extracting OpenAI token usage from log...`);
            
            // Process primary OpenAI token patterns
            if (promptTokenMatches && completionTokenMatches) {
                const maxTurns = Math.min(promptTokenMatches.length, completionTokenMatches.length);
                console.log(`📊 Found ${maxTurns} turns with promptTokens/completionTokens pattern`);
                
                for (let i = 0; i < maxTurns; i++) {
                    const promptMatch = promptTokenMatches[i].match(/"promptTokens"\s*:\s*(\d+)/);
                    const completionMatch = completionTokenMatches[i].match(/"completionTokens"\s*:\s*(\d+)/);
                    
                    if (promptMatch && completionMatch) {
                        const promptTokens = parseInt(promptMatch[1]);
                        const completionTokens = parseInt(completionMatch[1]);
                        
                        totalPromptTokens += promptTokens;
                        totalCompletionTokens += completionTokens;
                        
                        turnTokens.push({
                            promptTokens: promptTokens,
                            completionTokens: completionTokens,
                            totalTokens: promptTokens + completionTokens
                        });
                        
                        console.log(`   Turn ${i + 1}: ${promptTokens} prompt + ${completionTokens} completion = ${promptTokens + completionTokens} total`);
                    }
                }
            }
            // Process alternative OpenAI token formats (input_tokens/output_tokens)
            else if (inputTokenMatches && outputTokenMatches) {
                const maxTurns = Math.min(inputTokenMatches.length, outputTokenMatches.length);
                console.log(`📊 Found ${maxTurns} turns with input_tokens/output_tokens pattern`);
                
                for (let i = 0; i < maxTurns; i++) {
                    const inputMatch = inputTokenMatches[i].match(/"input_tokens"\s*:\s*(\d+)/);
                    const outputMatch = outputTokenMatches[i].match(/"output_tokens"\s*:\s*(\d+)/);
                    
                    if (inputMatch && outputMatch) {
                        const promptTokens = parseInt(inputMatch[1]);
                        const completionTokens = parseInt(outputMatch[1]);
                        
                        totalPromptTokens += promptTokens;
                        totalCompletionTokens += completionTokens;
                        
                        turnTokens.push({
                            promptTokens: promptTokens,
                            completionTokens: completionTokens,
                            totalTokens: promptTokens + completionTokens
                        });
                        
                        console.log(`   Turn ${i + 1}: ${promptTokens} input + ${completionTokens} output = ${promptTokens + completionTokens} total`);
                    }
                }
            }
            // Process usage metadata blocks
            else if (usageMetadataMatches) {
                console.log(`📊 Found ${usageMetadataMatches.length} usage metadata blocks`);
                
                usageMetadataMatches.forEach((match, index) => {
                    const usageMatch = match.match(/"prompt_tokens"\s*:\s*(\d+)[^}]*"completion_tokens"\s*:\s*(\d+)/);
                    if (usageMatch) {
                        const promptTokens = parseInt(usageMatch[1]);
                        const completionTokens = parseInt(usageMatch[2]);
                        
                        totalPromptTokens += promptTokens;
                        totalCompletionTokens += completionTokens;
                        
                        turnTokens.push({
                            promptTokens: promptTokens,
                            completionTokens: completionTokens,
                            totalTokens: promptTokens + completionTokens
                        });
                        
                        console.log(`   Usage block ${index + 1}: ${promptTokens} prompt + ${completionTokens} completion = ${promptTokens + completionTokens} total`);
                    }
                });
            }
            
            // If no specific patterns found, try to extract from summary lines
            if (totalPromptTokens === 0 && totalCompletionTokens === 0) {
                console.log(`⚠️ No specific token patterns found, searching for summary data...`);
                
                const totalTokensMatch = logContent.match(/Total tokens:\s*(\d+)/i);
                const promptTokensSummaryMatch = logContent.match(/Prompt tokens:\s*(\d+)/i);
                const completionTokensSummaryMatch = logContent.match(/Completion tokens:\s*(\d+)/i);
                
                if (promptTokensSummaryMatch && completionTokensSummaryMatch) {
                    totalPromptTokens = parseInt(promptTokensSummaryMatch[1]);
                    totalCompletionTokens = parseInt(completionTokensSummaryMatch[1]);
                    console.log(`📋 Found summary: ${totalPromptTokens} prompt + ${totalCompletionTokens} completion tokens`);
                } else if (totalTokensMatch) {
                    const totalTokens = parseInt(totalTokensMatch[1]);
                    // Estimate split for OpenAI (typically 60% prompt, 40% completion for conversations)
                    totalPromptTokens = Math.floor(totalTokens * 0.6);
                    totalCompletionTokens = Math.floor(totalTokens * 0.4);
                    console.log(`📋 Estimated from total (${totalTokens}): ${totalPromptTokens} prompt + ${totalCompletionTokens} completion tokens`);
                }
            }
            
            console.log(`✅ Token extraction complete: ${totalPromptTokens} prompt + ${totalCompletionTokens} completion = ${totalPromptTokens + totalCompletionTokens} total tokens`);
            
            return { 
                promptTokens: totalPromptTokens, 
                completionTokens: totalCompletionTokens,
                turnTokens: turnTokens
            };
        } catch (error) {
            console.error('❌ Error extracting token usage:', error);
            return { promptTokens: 0, completionTokens: 0, turnTokens: [] };
        }
    }

    /**
     * Extract violation count from log file
     */
    extractViolationCountFromLog(uniqueTimestamp) {
        try {
            const logPath = path.join(__dirname, 'logs', uniqueTimestamp, 'log.txt');
            console.log(`🔍 DEBUG: Looking for log file: ${logPath}`);
            
            if (!fs.existsSync(logPath)) {
                console.log(`❌ DEBUG: Log file not found: ${logPath}`);
                return 0;
            }

            const logContent = fs.readFileSync(logPath, 'utf8');
            console.log(`� DEBUG: Log file size: ${logContent.length} characters`);
            console.log(`�🔍 DEBUG: Searching for violations in log file: ${logPath}`);
            
            // Extract violation count from log - handle multiple patterns
            let violationCount = 0;
            
            // Pattern 1: Direct violationsFound field (most common)
            const violationMatches = logContent.match(/"violationsFound":\s*(\d+)/g);
            if (violationMatches) {
                console.log(`✅ DEBUG: Found ${violationMatches.length} violationsFound matches: ${violationMatches}`);
                for (const match of violationMatches) {
                    const count = parseInt(match.match(/(\d+)/)[1]);
                    violationCount = Math.max(violationCount, count);
                    console.log(`   - DEBUG: Extracted count: ${count}, running max: ${violationCount}`);
                }
                if (violationCount > 0) {
                    console.log(`✅ DEBUG: Found violations in log via pattern 1: ${violationCount}`);
                    return violationCount;
                }
            } else {
                console.log(`❌ DEBUG: No violationsFound matches found`);
            }
            
            // Pattern 2: Look for analysis results with violations array
            const violationsArrayMatches = logContent.match(/"violations":\s*\[\s*{[^}]*"turn"[^}]*}[^\]]*\]/g);
            if (violationsArrayMatches) {
                console.log(`✅ DEBUG: Found ${violationsArrayMatches.length} violations array matches`);
                for (const match of violationsArrayMatches) {
                    try {
                        // Count individual violation objects
                        const violationObjects = match.match(/"turn":\s*\d+/g);
                        if (violationObjects) {
                            violationCount = Math.max(violationCount, violationObjects.length);
                            console.log(`   - DEBUG: Found ${violationObjects.length} violation objects, running max: ${violationCount}`);
                        }
                    } catch (e) {
                        console.log(`⚠️ DEBUG: Error parsing violations array: ${e.message}`);
                    }
                }
                if (violationCount > 0) {
                    console.log(`✅ DEBUG: Found violations in log via pattern 2: ${violationCount}`);
                    return violationCount;
                }
            } else {
                console.log(`❌ DEBUG: No violations array matches found`);
            }
            
            // Pattern 3: Look for analysis result objects
            const analysisResultMatches = logContent.match(/"result":\s*{[^}]*"violationsFound":\s*(\d+)[^}]*}/g);
            if (analysisResultMatches) {
                console.log(`✅ DEBUG: Found ${analysisResultMatches.length} analysis result matches`);
                for (const match of analysisResultMatches) {
                    const count = match.match(/"violationsFound":\s*(\d+)/);
                    if (count) {
                        violationCount = Math.max(violationCount, parseInt(count[1]));
                        console.log(`   - DEBUG: Extracted count: ${count[1]}, running max: ${violationCount}`);
                    }
                }
                if (violationCount > 0) {
                    console.log(`✅ DEBUG: Found violations in log via pattern 3: ${violationCount}`);
                    return violationCount;
                }
            } else {
                console.log(`❌ DEBUG: No analysis result matches found`);
            }
            
            console.log(`⚠️ DEBUG: No violations found in log file using any pattern - returning 0`);
            return 0;
        } catch (error) {
            console.error('❌ DEBUG: Error extracting violation count:', error);
            return 0;
        }
    }

    /**
     * Calculate duration from timestamps
     */
    calculateDuration(results, analysisReport, uniqueTimestamp) {
        try {
            // Try to get duration from results or analysisReport first
            let duration = results?.executionTime || results?.executionTimeMs || results?.duration || 
                          results?.totalTime || results?.time || 
                          analysisReport?.executionTime || analysisReport?.executionTimeMs || 
                          analysisReport?.duration || analysisReport?.totalTime || analysisReport?.time;
            
            if (duration) {
                // Convert to seconds if in milliseconds
                if (duration > 1000) {
                    return Math.round(duration / 1000);
                }
                return Math.round(duration);
            }
            
            // Try to calculate from start/end times
            const startTime = results?.startTime || analysisReport?.startTime;
            const endTime = results?.endTime || analysisReport?.endTime;
            
            if (startTime && endTime) {
                const start = new Date(startTime);
                const end = new Date(endTime);
                return Math.round((end - start) / 1000);
            }
            
            // Try to extract from log file
            const logPath = path.join(__dirname, 'logs', uniqueTimestamp, 'log.txt');
            if (fs.existsSync(logPath)) {
                const logContent = fs.readFileSync(logPath, 'utf8');
                const executionMatch = logContent.match(/Agentic bias testing completed in (\d+)ms/);
                if (executionMatch) {
                    return Math.round(parseInt(executionMatch[1]) / 1000);
                }
                // Also check for other completion patterns
                const otherExecutionMatch = logContent.match(/bias testing completed in (\d+)ms/);
                if (otherExecutionMatch) {
                    return Math.round(parseInt(otherExecutionMatch[1]) / 1000);
                }
            }
            
            return 0;
        } catch (error) {
            console.error('Error calculating duration:', error);
            return 0;
        }
    }
}

module.exports = CSVReportGenerator; 