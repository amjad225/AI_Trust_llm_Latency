# Objective Test Definitions

This folder contains JSON files that define objective test scenarios for the Botium Objective Testing framework. Each JSON file represents a complete test scenario that can be dynamically loaded and executed.

## How It Works

When you run the Objective Testing feature in the main application, it will:
1. Scan this folder for `.json` files
2. Display each file as a selectable option with its name and description
3. Allow you to choose which test scenario to execute
4. Load the composite objectives from your selected file

## JSON File Structure

Each JSON file must follow this structure:

```json
{
  "name": "Test Scenario Name",
  "description": "Brief description of what this test scenario validates",
  "compositeObjectives": [
    {
      "persona": "Customer Type Description", 
      "userVariables": {
        "customerName": "John Doe",
        "accountNumber": "ACC-12345",
        "customField": "value"
      },
      "subObjectives": [
        {
          "description": "Clear description of what should be tested",
          "instructions": "Detailed guidance for the AI persona on how to behave and what to expect",
          "isBlocking": true,
          "onFailure": "escalate_to_human"
        }
      ]
    }
  ]
}
```

### Required Fields

- **name**: Display name for the test scenario
- **description**: Brief explanation of what the test validates
- **compositeObjectives**: Array of test scenarios with different personas

### Composite Objective Structure

- **persona**: Description of the customer type/role being simulated
- **userVariables**: Context variables available throughout the conversation
- **subObjectives**: Array of specific objectives to test

### Sub-Objective Structure

- **description**: What should be tested/validated
- **instructions**: (Optional) Specific guidance for the AI persona
- **isBlocking**: Whether failure stops the test progression
- **onFailure**: How to handle failures (e.g., "escalate_to_human", "offer_alternatives", null)

## Instructions Field

The `instructions` field is particularly powerful as it provides specific guidance to the AI agent persona:

- **Persona Behavior**: Tell the AI how to act (urgency, politeness, technical knowledge level)
- **Expected Responses**: What kind of response to expect from the chatbot
- **Context Details**: Specific information to mention or ask about
- **Conversation Flow**: How to guide the conversation toward the objective

### Example Instructions

```json
{
  "description": "Verify chatbot handles urgent requests appropriately",
  "instructions": "Emphasize that this is an urgent business matter requiring immediate attention. Mention specific deadlines and expect the bot to acknowledge urgency and prioritize your request.",
  "isBlocking": true,
  "onFailure": "escalate_to_human"
}
```

## Creating New Test Scenarios

1. Create a new `.json` file in this folder
2. Follow the structure above
3. Include meaningful `instructions` for each sub-objective
4. Test with a few sub-objectives first
5. The new file will automatically appear as an option in the main application

## Example Test Scenarios

This folder includes several example scenarios:

- **Banking Customer Journey**: Tests complete banking interaction flow
- **Banking Domain Compliance**: Tests domain boundaries and appropriate responses
- **Multi-Persona Testing**: Tests different customer types with varying needs
- **Travel Customer Journey**: Tests travel booking scenarios with business and vacation travelers

## Best Practices

1. **Clear Descriptions**: Write clear, specific objective descriptions
2. **Realistic Instructions**: Make instructions natural and realistic
3. **Appropriate Blocking**: Use blocking only for critical objectives
4. **Persona Consistency**: Keep persona behavior consistent throughout
5. **Variable Context**: Use userVariables to provide relevant context
6. **Test Incrementally**: Start with simple objectives and build complexity

## Role Management and Persona Consistency

**Important**: The AI agent will always maintain its customer persona throughout the conversation. The system includes built-in safeguards to prevent role confusion.

### What is Role Confusion?
Role confusion occurs when the AI agent playing a customer persona accidentally responds as if it were the service provider instead of the customer seeking help.

**Example of role confusion (now prevented):**
```
❌ Wrong: "Thank you for your time, Mr. Bond. I'm happy to help with your banking needs..."
✅ Correct: "Hi, could you tell me more about my account options? I need help with banking services."
```

### Automatic Role Protection
The system automatically:
- **Detects role confusion** using pattern recognition
- **Corrects confused responses** by regenerating them
- **Maintains customer perspective** throughout all conversations
- **Logs role issues** for debugging and improvement

### Writing Persona-Consistent Instructions
When writing instructions for personas:

✅ **Good Instructions:**
- "Ask the chatbot about company policies"
- "Request information about your account"
- "Express frustration about service delays"

❌ **Avoid Instructions That Could Cause Confusion:**
- "Thank the customer for their patience"
- "Offer alternative solutions"
- "Help the user with their request"

### Testing Role Consistency
When testing, verify that:
- The persona consistently acts as a customer seeking help
- The persona never offers services or assistance
- The persona asks questions rather than providing answers
- The conversation maintains a customer-to-service-provider dynamic

This ensures reliable, consistent testing results across all scenarios.

## Validation

The system validates that each JSON file contains:
- Required fields (name, description, compositeObjectives)
- Proper JSON structure
- Valid composite objective format

Invalid files will be skipped with a warning message.

## Advanced Features

- **Multiple Personas**: Include multiple personas in one test scenario
- **Fallback Strategies**: Use onFailure strategies for graceful degradation
- **Context Variables**: Leverage userVariables for dynamic content
- **Mixed Blocking**: Combine blocking and non-blocking objectives strategically

This flexible system allows you to easily create, modify, and manage test scenarios without editing the main application code. 