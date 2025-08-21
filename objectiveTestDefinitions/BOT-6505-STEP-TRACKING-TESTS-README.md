# BOT-6505: Step-Based Tracking Test Scenarios

## Overview
These test scenarios validate the BOT-6505 fix that replaced problematic turn-based conversion logic with native step-based tracking. The old system failed when conversations contained multiple consecutive bot messages, causing incorrect step number calculations.

## Problem Being Fixed

### Old (Broken) System:
```javascript
// Problematic conversion formula:
const satisfiedTurn = Math.floor(satisfiedAtTurn / 2) + 1;

// Example failure:
conversationHistory = [
  { role: "user", content: "Hello" },           // Index 0
  { role: "assistant", content: "Hi there!" }, // Index 1 ← Objective satisfied here  
  { role: "assistant", content: "How can I help?" }, // Index 2 ← Bot follow-up
]

// Old calculation: satisfiedAtTurn=2 → Math.floor(2/2)+1 = Turn 2 ❌ (should be Step 3)
```

### New (Fixed) System:
```javascript
// Direct step number usage:
result.satisfiedAtStep = turnIndex + 1;

// Same example with fix:
// Step 1: User says "Hello"
// Step 2: Bot says "Hi there!" ← Objective satisfied at Step 2 ✅  
// Step 3: Bot says "How can I help?"
```

## Test Scenarios

### 1. BOT-6505-step-tracking-basic.json
**Purpose:** Basic validation of step tracking with simple multi-bot messages

**Key Test Cases:**
- Bot greeting at step 2
- Bot assistance offer at step 3 (follow-up message)
- User inquiry and bot response validation

**Expected Results:**
- ✅ `satisfiedAtStep: 2` for greeting objective
- ✅ `satisfiedAtStep: 3` for assistance objective
- ✅ No conversion math anywhere in output

### 2. BOT-6505-step-tracking-complex.json
**Purpose:** Complex scenarios with extended multi-bot message sequences

**Key Test Cases:**
- Technical support with multiple troubleshooting steps
- Multi-topic information requests
- Escalation scenarios with explanations

**Expected Results:**
- ✅ Accurate step tracking across conversation turns
- ✅ Multiple objectives satisfied at different steps
- ✅ Correct step numbers in complex bot response patterns

### 3. BOT-6505-step-tracking-edge-cases.json
**Purpose:** Edge cases that broke the old turn-based system

**Key Test Cases:**
- Bot-initiated conversations (bot speaks first)
- Rapid consecutive bot messages
- Error handling and recovery sequences
- Validation scenarios with specific step targets

**Expected Results:**
- ✅ Step 3 satisfaction shows as `satisfiedAtStep: 3` (not Turn 2)
- ✅ Step 5 satisfaction shows as `satisfiedAtStep: 5` (not Turn 3)
- ✅ Any conversation pattern handled correctly

## Running the Tests

### 1. Execute Test Scenarios
```bash
node app.js
# Select Route 13 - Objective Testing
# Choose one of the BOT-6505 test files
```

### 2. What to Look For

#### ✅ Success Indicators:
- Console shows: `🎯 Satisfied at Step: X` (not "Turn")
- Step numbers match conversation history position
- No `Math.floor()` conversion formulas in output
- Multiple consecutive bot messages handled correctly

#### ❌ Failure Indicators (if fix didn't work):
- Console shows: `🎯 Satisfied in Turn: X` 
- Step numbers don't match actual conversation position
- Conversion math visible in logs
- Multi-bot messages cause incorrect calculations

### 3. Manual Validation Steps

#### Step Counting Verification:
1. **Count conversation steps manually:**
   ```
   Step 1: User message
   Step 2: Bot response 1
   Step 3: Bot response 2 (if consecutive)
   Step 4: User message
   Step 5: Bot response
   ```

2. **Compare with reported satisfiedAtStep:**
   - Should match exactly (no +1 or /2 adjustments)
   - Should handle any message pattern correctly

#### Multi-Bot Message Test:
1. **Trigger scenarios with pattern:** User → Bot → Bot → Bot
2. **Verify step accuracy:** If objective satisfied at Bot's 2nd message, should show `satisfiedAtStep: 3`
3. **Confirm no conversion:** No mathematical transformation of the step number

## Expected Output Examples

### Before Fix (Broken):
```
🎯 Satisfied in Turn: 2 (converted from satisfiedAtTurn: 3)  ❌ Wrong!
```

### After Fix (Correct):
```
🎯 Satisfied at Step: 3                                      ✅ Correct!
```

## AI Agent Notes for Manual Testing

When manually testing these scenarios:

### Relative Code Paths:
- **Main display logic:** `app.js:4046-4058` 
- **Step generation:** `botium-box/packages/botium-coach/src/objectiveTesting/objectiveEvaluator.js:40-42,87`
- **Completion tracking:** `botium-box/packages/botium-coach/src/objectiveTesting/objectiveTestRunner.js:743-748,759-763`
- **Result building:** `botium-box/packages/botium-coach/src/objectiveTesting/testResultBuilder.js:108-109`

### Key Changes Made:
1. **Eliminated conversion formula:** Removed `Math.floor(satisfiedAtTurn / 2) + 1`
2. **Native step generation:** `result.satisfiedAtStep = turnIndex + 1`
3. **Direct step usage:** No mathematical transformations
4. **Consistent terminology:** "Step" instead of "Turn" throughout

### Validation Checklist:
- [ ] Step numbers match conversation history position exactly
- [ ] Multi-bot messages handled correctly
- [ ] No conversion formulas in output
- [ ] Consistent step-based terminology
- [ ] Edge cases (bot-first, rapid responses) work correctly

## Success Criteria

The BOT-6505 fix is successful when:
1. **Zero conversion logic** anywhere in the system
2. **Native step numbers** used throughout (1,2,3... matching conversation history)
3. **Multi-bot messages** tracked accurately  
4. **Any conversation pattern** handled correctly
5. **Step-based terminology** used consistently

## Notes

These test scenarios specifically target the multi-bot message patterns that broke the old turn-based system. They provide comprehensive validation that the new step-based approach handles all conversation patterns correctly.