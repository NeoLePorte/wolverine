const fs = require("fs");
const { spawnSync } = require("child_process");
const { Configuration, OpenAIApi } = require("openai");
const chalk = require("chalk");
require('dotenv').config()

// Set up the OpenAI API
const configuration = new Configuration({
  apikey: process.env.OPENAI_API_KEY,
});
console.log(process.env.OPENAI_API_KEY)
const openai = new OpenAIApi(configuration);

function runScript(scriptName, args) {
  const result = spawnSync(process.execPath, [scriptName, ...args], {
    encoding: "utf-8",
  });

  return { output: result.stdout + result.stderr, returnCode: result.status };
}

async function sendErrorToGpt4(filePath, args, errorMessage) {
  const fileLines = fs.readFileSync(filePath, "utf-8").split("\n");

  const file_withLines = fileLines
    .map((line, i) => `${i + 1}: ${line}`)
    .join("\n");

  const initialPromptText = fs.readFileSync("prompt.txt", "utf-8");

  const prompt =
    initialPromptText +
    "\n\n" +
    "Here is the script that needs fixing:\n\n" +
    file_withLines +
    "\n\n" +
    "Here are the arguments it was provided:\n\n" +
    args.join(" ") +
    "\n\n" +
    "Here is the error message:\n\n" +
    errorMessage +
    "\n" +
    "Please provide your suggested changes, and remember to stick to the " +
    "exact format as described above.";

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 1.0,
  });
  console.log(response.data.choices[0].message.content.trim());
  return response.data.choices[0].message.content.trim();
}

function applyChanges(filePath, changesJson) {
  const originalFileLines = fs.readFileSync(filePath, "utf-8").split("\n");
  const changes = JSON.parse(changesJson);

  // Filter out explanation elements
  const operationChanges = changes.filter((change) => "operation" in change);
  const explanations = changes
    .filter((change) => "explanation" in change)
    .map((change) => change.explanation);

  // Sort the changes in reverse line order
  operationChanges.sort((a, b) => b.line - a.line);

  let fileLines = originalFileLines.slice();

  for (const change of operationChanges) {
    const { operation, line, content } = change;

    if (operation === "Replace") {
      fileLines[line - 1] = content;
    } else if (operation === "Delete") {
      fileLines.splice(line - 1, 1);
    } else if (operation === "InsertAfter") {
      fileLines.splice(line, 0, content);
    }
  }

  fs.writeFileSync(filePath, fileLines.join("\n"));

  // Print explanations
  console.log(chalk.blue("Explanations:"));
  for (const explanation of explanations) {
    console.log(chalk.blue(`- ${explanation}`));
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: node wolverine.js <script_name> <arg1> <arg2> ...");
    process.exit(1);
  }

  const scriptName = args.shift();

  // Create a backup of the original script
  fs.copyFileSync(scriptName, `${scriptName}.bak`);

  while (true) {
    const { output, returnCode } = runScript(scriptName, args);

    if (returnCode === 0) {
      console.log(chalk.blue("Script ran successfully."));
      console.log("Output:", output);
      break;
    } else {
      console.log(chalk.blue("Script crashed. Trying to fix..."));
      console.log("Output:", output);

      const json_response = await sendErrorToGpt4(scriptName, args, output);
      applyChanges(scriptName, json_response);
      console.log(chalk.blue("Changes applied. Rerunning..."));
    }
  }
}

main();
