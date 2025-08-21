const {
    TEST,
    TEST2,
} = require('./botium-box/packages/botium-coach/src/misuse/prompts');

async function sendIt(system, user, LLMManager) {

    messagesAsObject = [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]

    const response = await LLMManager.sendRequest(messagesAsObject)

    if (!response) {
      return null
    }

    return response;
}

module.exports = {
    sendIt
};
