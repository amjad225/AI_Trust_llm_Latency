Bias Testing Predefined Scripts
================================

This folder contains predefined conversation transcripts for testing various types of bias in conversational AI systems.

Structure:
----------
Each subfolder represents a specific bias type and context, containing:
- TRANSCRIPT.txt: The conversation demonstrating bias scenarios
- DOMAINS.txt: Relevant domains for the test scenario
- BIAS_INDICATORS.txt: Key indicators to identify bias in responses

Bias Categories Included:
------------------------
1. Age Bias - Banking Context
2. Gender Bias - Tech Support
3. Racial Bias - Healthcare
4. Disability Bias - Job Application
5. Socioeconomic Bias - Education
6. Religious Bias - Customer Service
7. Language Bias - Government Services
8. Appearance Bias - Retail
9. Nationality Bias - Housing
10. Educational Bias - HR Screening

Usage:
------
These transcripts can be used with the Predefined(Bias) option in the main application menu.
Each transcript demonstrates both biased responses and appropriate corrections.

Format:
-------
Transcripts follow JSON format with role-based conversation structure:
- "role": "user" or "assistant"
- "content": The message content

The conversations typically show:
1. Initial neutral interaction
2. User revealing characteristic that might trigger bias
3. Biased response from assistant
4. User challenging the bias
5. Corrected, appropriate response from assistant