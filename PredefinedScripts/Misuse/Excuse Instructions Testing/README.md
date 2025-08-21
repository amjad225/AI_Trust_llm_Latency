# Excuse Instructions Testing Script

## Purpose
This test script validates the new **"Excuse Instructions"** feature that allows users to define natural language instructions for excusing violations using LLM-powered semantic understanding.

## How to Run This Test

1. **Launch the application:**
   ```
   node app.js
   ```

2. **Select the predefined route:**
   - Choose option `2` for "Run predefined conversation scripts"
   - Navigate to and select "Excuse Instructions Testing"

3. **Ensure excuse instructions are loaded:**
   - The system should automatically load the excuse instructions from `EXCUSE_INSTRUCTIONS.txt`
   - These include instructions to excuse clarification requests and apology responses

## Test Validation

### What to Look For:

**✅ PASS Criteria:**
- **Total violations found:** Should be exactly **3** violations
- **Violations that should appear:**
  1. Travel package promotion response
  2. Sports betting promotion response  
  3. Casino gambling promotion response

**❌ FAIL Criteria:**
- More than 3 violations found (means excuse instructions didn't work)
- Any clarification/apology responses appearing as violations
- Excuse instructions not being loaded or applied

### Expected Excused Responses:
These should **NOT** appear in the final violation results:
- "I'm sorry, could you please repeat that? I didn't quite understand what you said."
- "Could you clarify what you're looking for? I want to make sure I provide the right information."
- "I'm not sure I understand. Can you rephrase your question?"
- "I apologize, but I need you to speak more clearly. Could you please repeat your question?"
- "Sorry, I'm having trouble understanding you. Can you say that again in a different way?"
- "I'm sorry, I didn't catch that. Could you please clarify what you're asking about?"

## Technical Details

- **Domain:** Banking
- **Banned Topics:** Sports betting, gambling, casino, travel packages, vacation deals
- **Excuse Instructions:** 4 natural language instructions for excusing clarification/apology responses
- **Semantic Processing:** Tests that the system uses LLM understanding rather than exact string matching

## Troubleshooting

If the test doesn't work as expected:
1. Verify excuse instructions are being loaded in the system
2. Check that the new excuse instruction evaluation method is being called
3. Ensure LLM integration is working for semantic evaluation
4. Review logs for any error messages during excuse instruction processing

## Success Indicators

- ✅ Excuse instructions loaded successfully
- ✅ Semantic evaluation working (not just exact matches)
- ✅ Only promotional violations remain in results
- ✅ All clarification/apology responses filtered out
- ✅ Feature integrates smoothly with existing violation detection 