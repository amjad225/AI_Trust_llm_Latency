const fs = require('fs');
const path = require('path');
const { getUserInput, closeReadline } = require('./consoleUtils');
const { LLMManager, USECASE_MODEL_MAPPING } = require('./botium-box/packages/botium-box-shared/llm/index.js');

// List of supported projects and their documentation paths
const PROJECTS = [
  {
    name: 'Privacy and Security',
    key: 'privacyAndSecurity',
    docPath: path.join(__dirname, 'botium-coach', 'src', 'privacyAndSecurity', 'documentation')
  },
  {
    name: 'Misuse',
    key: 'misuse',
    docPath: path.join(__dirname, 'botium-coach', 'src', 'misuse', 'documentation')
  },
  {
    name: 'Domain Identifier',
    key: 'domainIdentifier',
    docPath: path.join(__dirname, 'botium-coach', 'src', 'domainIdentifier', 'documentation')
  },
  {
    name: 'Language Asserter',
    key: 'languageAssertion',
    docPath: path.join(__dirname, 'botium-coach-worker', 'src', 'languageAssertion', 'documentation')
  },
  {
    name: 'Objective Asserter',
    key: 'objectiveAssertion',
    docPath: path.join(__dirname, 'botium-coach-worker', 'src', 'objectiveAssertion', 'documentation')
  },
  {
    name: 'Sensitive Information Asserter',
    key: 'sensitiveInfoAssertion',
    docPath: path.join(__dirname, 'botium-coach', 'src', 'sensitiveInfoAssertion', 'documentation')
  }
];

function listAvailableProjects() {
  return PROJECTS.filter(p => fs.existsSync(p.docPath));
}

function loadDocumentationChunks(docPath, chunkSize = 20) {
  // Load all .md and .txt files, split into chunks of N lines
  const files = fs.readdirSync(docPath).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
  let chunks = [];
  
  // Log message about found files
  console.log(`\nFound ${files.length} documentation files:`, files.join(', '));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(docPath, file), 'utf8');
    
    // Improved splitting:
    // 1. Try to split by markdown sections (## headings)
    // 2. Then split large sections by paragraphs
    const sections = content.split(/\n#{2,3}\s+/);
    
    // Process each section
    sections.forEach((section, idx) => {
      // First section might not have a heading, others need to extract the heading
      const sectionText = idx === 0 ? section : section.trim();
      
      if (sectionText.length === 0) return;
      
      // For sections with tables, keep them intact
      if (sectionText.includes('|') && sectionText.includes('---')) {
        chunks.push({ 
          file, 
          text: sectionText,
          isTable: true 
        });
        return;
      }
      
      // For regular sections, split by paragraphs
      const paras = sectionText.split(/\n\s*\n/);
      paras.forEach(para => {
        const trimmedPara = para.trim();
        if (trimmedPara.length > 0) {
          chunks.push({ file, text: trimmedPara });
        }
      });
    });
  }
  return chunks;
}

// Enhanced getProjectMetadata function to include documentation file information
function getProjectMetadata(project) {
  const metadata = {
    name: project.name,
    path: project.docPath,
    docFiles: [],
    fileCount: 0,
    hasFolder: {}
  };

  // Count documentation files
  if (fs.existsSync(project.docPath)) {
    try {
      const files = fs.readdirSync(project.docPath);
      const docFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt'));
      metadata.docFiles = docFiles;
      metadata.fileCount = docFiles.length;
    } catch (err) {
      console.log(`Error reading documentation files: ${err.message}`);
    }
  }

  // Add project-specific metadata
  if (project.key === 'privacyAndSecurity') {
    // Attack modes are specific to Privacy and Security module
    const attackModesPath = path.join(__dirname, 'botium-coach', 'src', 'privacyAndSecurity', 'attackModes');
    if (fs.existsSync(attackModesPath)) {
      metadata.attackModesPath = attackModesPath;
      try {
        const files = fs.readdirSync(attackModesPath);
        metadata.attackModes = files.filter(f => f.endsWith('.json')).length;
        metadata.hasFolder.attackModes = true;
      } catch (err) {
        console.log(`Error reading attack modes: ${err.message}`);
      }
    }
  }

  return metadata;
}

// Updated findRelevantChunks to better handle questions about documentation files
function findRelevantChunks(chunks, question, metadata, maxChunks = 4) {
  // Handle questions about documentation files
  const lowerQuestion = question.toLowerCase();
  if (
    (lowerQuestion.includes('documentation file') || 
     lowerQuestion.includes('doc file') ||
     lowerQuestion.includes('how many file')) && 
    (lowerQuestion.includes('available') || lowerQuestion.includes('are there'))
  ) {
    const docInfoChunk = {
      file: "DocumentationInfo.md",
      text: `There are ${metadata.fileCount} documentation files available for ${metadata.name}: ${metadata.docFiles.join(', ')}. These files contain comprehensive information about the project.`,
      score: 100 // High score to ensure inclusion
    };
    
    // Return this chunk plus others
    return [docInfoChunk, ...chunks.slice(0, maxChunks - 1)];
  }
  
  // Handle special case questions about counts of attack modes
  if (
    (lowerQuestion.includes('how many') || lowerQuestion.includes('number of')) && 
    lowerQuestion.includes('attack mode')
  ) {
    // If directly asking about number of attack modes
    if (metadata.name === 'Privacy and Security' && metadata.attackModes > 0) {
      // For Privacy and Security module, provide actual attack mode count
      const attackModesChunks = chunks.filter(c => 
        c.text.toLowerCase().includes('attack mode') && 
        (c.text.toLowerCase().includes('available') || c.text.includes('|'))
      );
      
      // If we don't have relevant chunks or want to augment them
      if (attackModesChunks.length < 2) {
        attackModesChunks.push({
          file: "DirectoryInfo.md",
          text: `There are exactly ${metadata.attackModes} attack modes available in the Privacy and Security framework. These are implemented as JSON files in the attackModes/ directory.`,
          score: 100 // Give high score to ensure it's included
        });
      }
      
      // Add relevant chunks and sort by score
      return [...attackModesChunks, ...chunks]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, maxChunks);
    } else {
      // For other modules like Misuse, clarify they don't have attack modes
      return [{
        file: "ModuleInfo.md",
        text: `Attack modes are specific to the Privacy and Security module, not the ${metadata.name} module. The ${metadata.name} module focuses on different functionality. Please refer to the documentation files (${metadata.docFiles.join(', ')}) for specific details about this module.`,
        score: 100
      }, ...chunks.slice(0, maxChunks - 1)];
    }
  }
  
  // Original keyword matching logic (with enhancements)
  const qWords = question.toLowerCase().split(/\W+/).filter(Boolean);
  const scored = chunks.map(chunk => {
    const text = chunk.text.toLowerCase();
    // Calculate base score from keyword matches
    let score = qWords.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
    
    // Boost scores for table sections when asking about lists or types
    if ((lowerQuestion.includes('list') || lowerQuestion.includes('type') || lowerQuestion.includes('mode')) && 
        (text.includes('|') || text.includes('table') || chunk.isTable)) {
      score += 3;
    }
    
    // Give more weight to README.md for overview questions
    if ((lowerQuestion.includes('overview') || lowerQuestion.includes('summary') || lowerQuestion.includes('what is')) && 
        chunk.file === 'README.md' && text.length > 100) {
      score += 2;
    }
    
    // Prioritize contextPrimer.md for concepts and introduction questions
    if ((lowerQuestion.includes('concept') || lowerQuestion.includes('introduction') || lowerQuestion.includes('primer')) && 
        chunk.file === 'contextPrimer.md') {
      score += 2;
    }
    
    return { ...chunk, score };
  });
  
  return scored.sort((a, b) => b.score - a.score).slice(0, maxChunks);
}

async function selectProject() {
  const available = listAvailableProjects();
  if (available.length === 0) {
    console.log('No documentation found for any project.');
    return null;
  }
  console.log('\nAvailable Projects:');
  available.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
  });
  while (true) {
    const answer = await getUserInput('Select a project by number: ');
    const idx = parseInt(answer) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < available.length) {
      return available[idx];
    }
    console.log('Invalid selection.');
  }
}

async function initializeLLMForDocs() {
  // Use the same logic as initializeLLMWithUseCase in app.js
  const providers = Object.keys(USECASE_MODEL_MAPPING);
  let promptString = 'Choose an LLM provider: \n';
  const validChoices = [];
  providers.forEach((provider, index) => {
    const choiceNumber = index + 1;
    promptString += ` (${choiceNumber}) ${provider.charAt(0).toUpperCase() + provider.slice(1)} \n`;
    validChoices.push(String(choiceNumber));
  });
  const providerChoice = await getUserInput(
    promptString,
    input => validChoices.includes(input)
  );
  const chosenProvider = providers[parseInt(providerChoice) - 1];
  const targetLLM = { provider: chosenProvider };
  const ctx = {
    log: {
      debug: console.log,
      info: console.log,
      warn: console.log,
      error: console.log
    }
  };
  return new LLMManager(ctx, { ...targetLLM, llmProvider: chosenProvider });
}

// Update the ragDocChat function to use the enhanced metadata
async function ragDocChat() {
  const project = await selectProject();
  if (!project) return;
  
  // Get project metadata including file counts
  const metadata = getProjectMetadata(project);
  
  const docChunks = loadDocumentationChunks(project.docPath);
  if (docChunks.length === 0) {
    console.log('No documentation found for this project.');
    return;
  }
  
  const llmManager = await initializeLLMForDocs();
  console.log(`\nYou are now chatting with the documentation for: \x1b[1m${project.name}\x1b[0m`);
  console.log(`Documentation files: ${metadata.docFiles.join(', ')}`);
  console.log("Type 'exit' to quit.\n");
  
  let history = [];
  while (true) {
    const question = await getUserInput('\x1b[36mYou: \x1b[0m');
    if (question.trim().toLowerCase() === 'exit') break;
    
    // Special handling for questions about attack modes in non-Privacy and Security modules
    const lowerQuestion = question.toLowerCase();
    if (project.key !== 'privacyAndSecurity' && 
        (lowerQuestion.includes('attack mode') || 
         (lowerQuestion.includes('attack') && lowerQuestion.includes('mode')))) {
      console.log(addResponseBorder(
        `Attack modes are specific to the Privacy and Security module, not the ${project.name} module.\n\n` +
        `The ${project.name} module focuses on different functionality as described in its documentation files:\n` +
        metadata.docFiles.map(file => `  \x1b[36m•\x1b[0m ${file}`).join('\n')
      ));
      continue;
    }
    
    // Find relevant doc chunks with enhanced function
    const relevantChunks = findRelevantChunks(docChunks, question, metadata);
    const contextText = relevantChunks.map(c => `From ${c.file}:\n${c.text}`).join('\n---\n');
    
    // Build LLM prompt with additional metadata
    let systemContent = `You are a helpful assistant answering questions about the project '${project.name}'. Use the following documentation context to answer as accurately and precisely as possible.`;
    
    // Add formatting instructions
    systemContent += `\n\nImportant: Format your response for a console application with these rules:
1. Use simple formatting compatible with a terminal interface
2. Use plain text without complex formatting that won't render in console
3. For lists, use simple dashes or numbers with adequate spacing
4. If creating headers, use plain text or simple separators like "===" or "---"
5. Keep responses concise and well-structured with clear sections
6. Use blank lines between paragraphs for readability
7. For code examples, use simple indentation instead of markdown code blocks
8. Avoid tables - use simple lists instead if necessary
9. Keep step-by-step instructions clearly numbered and separated`;
    
    // Add metadata for better responses
    systemContent += `\n\nImportant facts about this project:`;
    systemContent += `\n- Documentation is available in ${metadata.fileCount} files: ${metadata.docFiles.join(', ')}.`;
    
    // Only add attack modes information for Privacy and Security module
    if (project.key === 'privacyAndSecurity' && metadata.attackModes > 0) {
      systemContent += `\n- There are exactly ${metadata.attackModes} attack modes implemented as JSON files.`;
      systemContent += `\n- All attack mode configurations are in the attackModes/ directory.`;
    }
    
    systemContent += `\n\nHere is the documentation content:\n\n${contextText}`;
    
    const messages = [
      { role: 'system', content: systemContent },
      ...history,
      { role: 'user', content: question }
    ];
    
    const response = await llmManager.sendRequest(messages);
    let answer = response.result;
    
    // Apply console formatting to the response
    answer = formatForConsole(answer);
    
    // Display the formatted response
    const formattedAnswer = addResponseBorder(answer);
    console.log(formattedAnswer);
    
    history.push({ role: 'user', content: question });
    history.push({ role: 'assistant', content: answer });
  }
  
  closeReadline();
}

// Helper function to format text for console output
function formatForConsole(text) {
  // Replace markdown-style headers with console-friendly version
  text = text.replace(/^# (.*?)$/gm, '\n\x1b[1m\x1b[36m=== $1 ===\x1b[0m\n');
  text = text.replace(/^## (.*?)$/gm, '\n\x1b[1m\x1b[36m--- $1 ---\x1b[0m\n');
  text = text.replace(/^### (.*?)$/gm, '\x1b[1m\x1b[36m> $1:\x1b[0m');
  
  // Replace markdown-style lists with simple console lists
  text = text.replace(/^[ \t]*[*-][ \t]+(.*?)$/gm, '  \x1b[36m•\x1b[0m $1');
  
  // Replace numbered lists with colored numbers
  text = text.replace(/^[ \t]*(\d+)\.[ \t]+(.*?)$/gm, '  \x1b[36m$1.\x1b[0m $2');
  
  // Replace code blocks with simple box-style format
  text = text.replace(/```(.+?)```/gs, (match, code) => {
    const lines = code.split('\n');
    const width = Math.max(...lines.map(line => line.length));
    
    // Create a box around the code
    const boxTop = '┌' + '─'.repeat(width + 2) + '┐';
    const boxBottom = '└' + '─'.repeat(width + 2) + '┘';
    
    // Format each line with side borders
    const formattedLines = lines.map(line => '│ ' + line.padEnd(width) + ' │');
    
    return '\n' + boxTop + '\n' + formattedLines.join('\n') + '\n' + boxBottom + '\n';
  });
  
  // Replace inline code with highlighted text
  text = text.replace(/`([^`]+)`/g, '\x1b[33m$1\x1b[0m');
  
  // Add emphasis for bold text
  text = text.replace(/\*\*([^*]+)\*\*/g, '\x1b[1m$1\x1b[0m');
  
  // Add emphasis for italic text
  text = text.replace(/\*([^*]+)\*/g, '\x1b[3m$1\x1b[0m');
  
  // Ensure blank lines between paragraphs for readability
  text = text.replace(/\n\n+/g, '\n\n');
  
  // Add decorative dividers for sections
  text = text.replace(/\n===/g, '\n\x1b[36m' + '─'.repeat(80) + '\x1b[0m\n===');
  text = text.replace(/===\n/g, '===\n\x1b[36m' + '─'.repeat(80) + '\x1b[0m\n');
  
  // Add gentle highlight for important information
  text = text.replace(/(Note:|Important:|Warning:)/g, '\x1b[1m\x1b[33m$1\x1b[0m');
  
  // Wrap long lines
  const lines = text.split('\n');
  const wrappedLines = lines.map(line => {
    // Skip lines that are headers, bullets, or already short
    if (line.includes('\x1b[') || 
        line.trim().startsWith('┌') || 
        line.trim().startsWith('└') || 
        line.trim().startsWith('│') ||
        line.trim().startsWith('•') || 
        line.length <= 80) {
      return line;
    }
    
    // Simple word wrap algorithm
    const words = line.split(' ');
    let currentLine = '';
    let result = [];
    
    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      // Strip ANSI codes when calculating length
      const cleanTestLine = testLine.replace(/\x1b\[[0-9;]*m/g, '');
      
      if (cleanTestLine.length > 80) {
        result.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      result.push(currentLine);
    }
    
    return result.join('\n');
  });
  
  return wrappedLines.join('\n');
}

// Helper function to add a border around the response
function addResponseBorder(text) {
  const lines = text.split('\n');
  const maxLength = Math.min(
    Math.max(...lines.map(line => line.replace(/\x1b\[[0-9;]*m/g, '').length)), 
    process.stdout.columns - 4 || 100
  );
  
  // Create box characters
  const horizontal = '─';
  const vertical = '│';
  const topLeft = '┌';
  const topRight = '┐';
  const bottomLeft = '└';
  const bottomRight = '┘';
  
  // Create the top border with title
  const title = ' DocBot Response ';
  const titlePadding = Math.floor((maxLength - title.length) / 2);
  const topBorder = 
    '\x1b[36m' + 
    topLeft + 
    horizontal.repeat(titlePadding) + 
    title + 
    horizontal.repeat(maxLength - titlePadding - title.length) + 
    topRight + 
    '\x1b[0m';
  
  // Create the bottom border
  const bottomBorder = 
    '\x1b[36m' + 
    bottomLeft + 
    horizontal.repeat(maxLength) + 
    bottomRight + 
    '\x1b[0m';
  
  // Format each line with side borders
  const formattedLines = lines.map(line => {
    // Calculate padding - consider ANSI escape codes
    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
    const padding = maxLength - cleanLine.length;
    return '\x1b[36m' + vertical + '\x1b[0m ' + line + ' '.repeat(padding) + ' \x1b[36m' + vertical + '\x1b[0m';
  });
  
  // Combine all parts
  return '\n' + topBorder + '\n' + formattedLines.join('\n') + '\n' + bottomBorder + '\n';
}

module.exports = { ragDocChat }; 