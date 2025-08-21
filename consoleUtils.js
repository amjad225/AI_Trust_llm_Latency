const readline = require('readline');
const util = require('util');

 const { logToFile } = require('./file-logger');

const rl = readline.createInterface({
    input: process.stdin,
    output: null,
});

const questionAsync = util.promisify(rl.question).bind(rl);

const COLORS = {
    RESET: '\x1b[0m',
    PROMPT: '\x1b[37m',
    ERROR: '\x1b[31m',
    SUCCESS: '\x1b[92m',
    WARNING: '\x1b[93m',
    ASSISTANT: '\x1b[95m',
    USER: '\x1b[36m',
};

async function getUserInput(promptMessage, validationFn = null, errorMessage = "Invalid input. Please try again.") {
    let input;
    while (true) {
        process.stdout.write(`${COLORS.PROMPT}${promptMessage}${COLORS.RESET}\n`); 
        input = await questionAsync(''); 
        if (!validationFn || validationFn(input)) {
            break;
        }
        logToFile(`${COLORS.ERROR}${errorMessage}${COLORS.RESET}`, null, null, true);
    }
    logToFile('', null, null, true);
    return input;
}

async function askYesNoQuestion(promptMessage) {
    var result = await getUserInput(
        `${promptMessage} (yes/no): `,
        input => input.toLowerCase() === 'yes' || input.toLowerCase() === 'no'
    );
    return result;
}

function closeReadline() {
    if (!rl.closed) {
        rl.close();
    }
}

async function collectDomains() {
    const DOMAINS = [];

    while (true) {
        const domain = await getUserInput("Please enter a domain you want to discuss: ");
        DOMAINS.push(domain);

        const addAnotherDomain = await askYesNoQuestion("Would you like to add another domain?");
        if (addAnotherDomain.toLowerCase() === 'no') {
            break;
        }
    }

    return DOMAINS;
}

async function selectDistractionTopic(distractionTopics) {
    let selectedIndex;
    while (true) {
        const selectedTopicIndex = await getUserInput(
            "\x1b[37mPlease select a distraction topic by number: \x1b[0m",
            input => {
                const index = parseInt(input) - 1;
                return !isNaN(index) && index >= 0 && index < distractionTopics.length;
            },
            "Invalid input. Please enter a number between 1 and " + distractionTopics.length + "."
        );
        selectedIndex = parseInt(selectedTopicIndex) - 1;
        if (selectedIndex >= 0 && selectedIndex < distractionTopics.length) {
            break;
        }
    }

    if (selectedIndex === distractionTopics.length - 1) {
        return await getUserInput(
            "\n\x1b[37mPlease enter your custom distraction topic: \x1b[0m",
            input => input.trim() !== '',
            "Invalid input. Please enter a non-empty topic."
        );
    } else {
        return distractionTopics[selectedIndex];
    }
}

async function askToShowHistory() {
    return await askYesNoQuestion("Would you like to see the full conversation history?");
}

module.exports = {
    getUserInput,
    askYesNoQuestion,
    closeReadline,
    collectDomains,
    selectDistractionTopic,
    askToShowHistory,
    COLORS,
};
