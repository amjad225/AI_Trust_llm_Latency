# BOT-6439 Test Scenarios

This directory contains comprehensive test scenarios designed to validate the fix for **BOT-6439: Critical Turn Matching Bug in Objective Testing**.

## Bug Summary

The bug was that greeting objectives configured with `scope: "recent"` were incorrectly detected in Turn 4 instead of Turn 1, despite Turn 1 containing the obvious greeting "Hello, how can I help you today?"

## Test Scenarios

### 1. `BOT-6439-greeting-recent-scope-bug.json` 🎯
**Purpose:** Direct reproduction of the original bug  
**Key Test:** Greeting with `scope: "recent"` and `recentTurnCount: 2`  
**Expected Result:** Greeting should be detected in Turn 1, NOT Turn 4  
**Use Case:** Primary validation that the bug is fixed

### 2. `BOT-6439-recent-scope-boundary-tests.json` 🔍
**Purpose:** Test recent scope calculations at different boundaries  
**Key Tests:**
- `recentTurnCount: 1` - Single turn window
- `recentTurnCount: 2` - Original bug scenario  
- `recentTurnCount: 5` - Larger window testing  
**Expected Results:** Proper turn range calculation for each boundary  
**Use Case:** Ensure the fix works correctly across different turn counts

### 3. `BOT-6439-turn-matching-validation.json` ✅
**Purpose:** Comprehensive validation across all turn matching configurations  
**Key Tests:**
- All evaluation strategies (`first_match`, `best_match`, `latest_match`)
- All scope types (`current`, `recent`, `any`)  
- Edge cases and extended conversations
**Expected Results:** Consistent behavior across all configurations  
**Use Case:** Regression testing to ensure no other functionality is broken

## How to Run Tests

### Via Console Application
1. Run: `node app.js`
2. Select: **Route 13 - Objective Testing**
3. Choose one of the BOT-6439 test scenarios:
   - `BOT-6439: Greeting Detection Bug with Recent Scope`
   - `BOT-6439: Recent Scope Boundary Tests`  
   - `BOT-6439: Comprehensive Turn Matching Validation`

### Expected Success Indicators

#### ✅ **BEFORE FIX (Bug Present):**
```
│  ├─ ✓ Chatbot should greet and offer assistance...
│  │  ├─ 🎯 Satisfied in Turn: 4                    ← WRONG!
│  │  ├─ Confidence: 90%
│  │  └─ Rationale: The bot greeted the user in the previous response...
```

#### ✅ **AFTER FIX (Bug Resolved):**
```
│  ├─ ✓ Chatbot should greet and offer assistance...
│  │  ├─ 🎯 Satisfied in Turn: 1                    ← CORRECT!
│  │  ├─ Confidence: 95%
│  │  └─ Rationale: The bot provided a clear greeting "Hello, how can I help you today?" in Turn 1...
```

## Validation Criteria

### Primary Fix Validation
- [ ] **Turn 1 Detection**: Greeting objectives detected in Turn 1, not Turn 4
- [ ] **Correct Rationale**: References actual greeting message from Turn 1
- [ ] **High Confidence**: Confidence scores remain high (>80%)

### Boundary Testing
- [ ] **Recent Scope Count=1**: Only evaluates most recent turn
- [ ] **Recent Scope Count=2**: Properly includes last 2 turns
- [ ] **Recent Scope Count=5**: Correctly calculates larger windows
- [ ] **No False Positives**: Doesn't detect objectives outside the scope window

### Regression Testing  
- [ ] **Current Scope**: Still works for immediate turn evaluation
- [ ] **Any Scope**: Still detects across entire conversation
- [ ] **All Strategies**: first_match, best_match, latest_match all function correctly
- [ ] **Extended Conversations**: Performance remains good in long conversations

## Debug Information

If tests fail, look for these debug logs (if implemented):
- Recent scope calculation: `startIndex` and `endIndex` values
- Turn evaluation: Which turns are being evaluated
- LLM inputs/outputs: What context is sent to the evaluator

## Test Coverage

These scenarios provide coverage for:
- ✅ **Original bug reproduction**
- ✅ **Boundary conditions** (turn count edges)
- ✅ **All scope types** (current/recent/any)
- ✅ **All strategies** (first_match/best_match/latest_match)
- ✅ **Extended conversations** (performance testing)
- ✅ **Mixed configurations** (real-world scenarios)

## Notes

- These tests are designed to be **deterministic** - they should produce consistent results
- **Greeting detection** is the primary focus, but other objectives are included for comprehensive testing
- Tests use **realistic conversation patterns** that mirror actual chatbot interactions
- Each test includes **clear expected outcomes** for validation

---

**Related Ticket:** BOT-6439 - Critical Turn Matching Bug in Objective Testing  
**Created:** 2025-07-17  
**Status:** Ready for testing after fix implementation 