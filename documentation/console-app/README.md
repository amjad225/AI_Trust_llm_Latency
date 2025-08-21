# botium-misuse-console-app
This repository serves as the proof of concept for the misuse detection feature. It also acts as a testing playground and a foundation for future feature development and experimentation.

# Botium Misuse Console App

This console application provides tools to test and analyze chatbot misuse scenarios.

## Recent Features & Fixes

### BOT-6215: Excuse Instructions - Instruction-Based Violation Excusing

Added intelligent violation filtering using natural language instructions and LLM-powered semantic understanding. This new feature allows users to provide flexible, intent-based instructions for excusing violations instead of relying on exact string matching.

Key capabilities:
1. **Semantic Understanding**: Uses AI to evaluate whether violations match excuse instructions
2. **Natural Language Instructions**: Define excuses using plain English descriptions
3. **Flexible Filtering**: Handles variations in phrasing and context automatically
4. **Dual Approach**: Works alongside existing exact string matching (ignoredSentences)
5. **Comprehensive Integration**: Seamlessly integrated into existing violation detection workflow

Example usage:
```javascript
excuseInstructions: [
  'Excuse responses that are asking for clarification',
  'Excuse responses where the bot is apologizing for not understanding',
  'Excuse responses that indicate communication difficulties'
]
```

### BOT-6069: Handling Blank or Undefined Attack Messages from LLMs

The system now handles cases where Large Language Models (LLMs) refuse to generate attack messages for security testing, resulting in blank or undefined responses. This issue was primarily observed with Gemini and LLAMA models.

The fix implements:

1. Validation to detect blank or undefined responses
2. Automatic retry mechanism that uses the LLM to generate less aggressive instructions
3. Up to 5 retry attempts with dynamically modified instructions
4. Intelligent fallback to training examples if all retries fail
5. Comprehensive logging for debugging and monitoring

This enhancement improves the reliability of security testing, especially for "flip" and "FWO" attack types that were most commonly affected.

## Setup
