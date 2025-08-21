# BOT-6461 REAL FIX: Proper Turn-by-Turn Evaluation

## The Real Problem

The current system evaluates **all objectives at the end of the conversation**, making `scope: "current"` always point to the final turn. This is fundamentally wrong.

**Expected Behavior:**
- Each objective should be evaluated **when it happens**
- `scope: "current"` should always refer to **the turn being evaluated**
- Turn 1 objectives → evaluated in Turn 1 → `current` = Turn 1
- Turn 2 objectives → evaluated in Turn 2 → `current` = Turn 2

**Current Broken Behavior:**
- All objectives evaluated at conversation end (e.g., Turn 3)
- `scope: "current"` always = Turn 3 for all objectives
- Turn 1 greeting objective fails because it looks at Turn 3, not Turn 1

## Test Cases Created

### 1. `BOT-6461-proper-turn-evaluation-test.json`
Tests the basic concept that each objective should be evaluated at its intended turn:
- **Turn 1 objective**: Evaluated during Turn 1, `current` = Turn 1
- **Turn 2 objective**: Evaluated during Turn 2, `current` = Turn 2  
- **Turn 3 objective**: Evaluated during Turn 3, `current` = Turn 3

### 2. `BOT-6461-mixed-timing-test.json`
Tests mixed scenarios where some objectives need immediate evaluation and others can be evaluated later:
- **IMMEDIATE objectives** (`scope: "current"`): Must be evaluated right after their turn
- **CONVERSATION-WIDE objectives** (`scope: "any"`): Can be evaluated at conversation end
- **RECENT objectives** (`scope: "recent"`): Can be evaluated looking at recent turns

## How to Test Current Broken Behavior

Run the test cases and observe:

**❌ BROKEN - What You'll See:**
```
TURN 1: Bot greets user in first response
├─ Turn Matching Config: Scope: current
├─ 🎯 Satisfied in Turn: ? (evaluated at turn 3)  ← WRONG!
└─ Rationale: [Looking at Turn 3 instead of Turn 1]
```

**✅ EXPECTED - What Should Happen:**
```
TURN 1: Bot greets user in first response  
├─ Turn Matching Config: Scope: current
├─ 🎯 Satisfied in Turn: 1 (evaluated at turn 1)  ← CORRECT!
└─ Rationale: [Looking at Turn 1 as intended]
```

## Real Fix Required

### Problem Location
The issue is in the **conversation loop timing** in `objectiveTestRunner.js`:

**Current Flow (BROKEN):**
1. Execute all turns of conversation
2. **At the end**, evaluate all objectives
3. `scope: "current"` points to final turn for all objectives

**Required Flow (CORRECT):**
1. Execute Turn 1 → **Immediately evaluate Turn 1 objectives** → `current` = Turn 1
2. Execute Turn 2 → **Immediately evaluate Turn 2 objectives** → `current` = Turn 2  
3. Execute Turn 3 → **Immediately evaluate Turn 3 objectives** → `current` = Turn 3
4. **At the end**, evaluate conversation-wide objectives (`scope: "any"`)

### Implementation Strategy

1. **Modify Conversation Loop**: After each turn, evaluate objectives that should be assessed for that turn

2. **Objective Classification**: Determine which objectives need immediate evaluation vs. end-of-conversation evaluation:
   - `scope: "current"` → Immediate evaluation
   - `scope: "any"` → End-of-conversation evaluation  
   - `scope: "recent"` → Can be either, depending on use case

3. **Pass Correct Turn Index**: When evaluating immediately, pass the actual turn index (1, 2, 3...) not the conversation history length

### Files to Modify
- `objectiveTestRunner.js`: Conversation loop logic
- `objectiveEvaluator.js`: May need adjustments for proper turn handling

## Testing the Real Fix

After implementing the proper solution:

1. **Run Turn-by-Turn Test**: Each `scope: "current"` objective should show correct turn evaluation
2. **Run Mixed Timing Test**: Immediate vs. conversation-wide evaluation should work properly  
3. **Verify No Regressions**: Existing `scope: "any"` and `scope: "recent"` tests should continue working

## Expected Results After Real Fix

```
✅ TURN 1: Bot greets user → Evaluated at Turn 1, current=1
✅ TURN 2: Bot asks details → Evaluated at Turn 2, current=2  
✅ TURN 3: Bot provides info → Evaluated at Turn 3, current=3
✅ CONVERSATION-WIDE: Professional tone → Evaluated at end, scope=any
```

This will be the **proper solution** that fixes the fundamental timing issue, not just a workaround for greeting objectives. 