# Wolverine.js

## Give your JS/JSX scripts regenerative healing abilities!

Wolverine.js is a Node.js script that runs a specified script with arguments and fixes any errors encountered during execution with the help of the OpenAI GPT-4(recommended)/GPT-3.5 Turbo model. It is a JS clone of https://github.com/biobootloader/wolverine all credit goes there.

### Requirements

To run this script, you must have Node.js installed on your computer, and you must have an OpenAI API key to use the GPT-3.5 Turbo model.

### Installation

Clone this repository or download wolverine.js to your local machine.
Install dependencies by running npm install in the same directory as wolverine.js.
Create a .env file in the same directory as wolverine.js with the following content:

```
OPENAI_API_KEY=<your_openai_api_key>

```

Replace <your_openai_api_key> with your actual OpenAI API key. - warning! by default this uses GPT-4 and may make many repeated calls to the api.

### Usage

Run the script with the following command:

```
node wolverine.js <script_name> <arg1> <arg2> ...

```

**EXAMPLE**
```
node wolverine.js buggy_script.js "subtract" 20 3

```

Replace <script_name> with the name of the script you want to run and <arg1>, <arg2>, etc. with the arguments you want to pass to the script.

During execution, if an error is encountered, the script will use the GPT-3.5 Turbo model to generate a prompt asking for suggested changes to the script. The suggested changes are then applied, and the script is rerun.

The original script is automatically backed up before any changes are applied, and explanations for the changes made are printed to the console.

### Dependencies

fs: Node.js file system module.
child_process: Node.js child process module.
openai: Official OpenAI API module.
chalk: Node.js library for terminal string styling.
dotenv: Node.js module for loading environment variables from a .env file.

### To-Do
fix jest test

**some things biobootloader suggests**
*add flags to customize usage, such as using GPT3.5-turbo instead or asking for user confirmation before running changed code
*further iterations on the edit format that GPT responds in. Currently it struggles a bit with indentation, but I'm sure that can be improved
*a suite of example buggy files that we can test prompts on to ensure reliablity and measure improvement
*multiple files / codebases: send GPT everything that appears in the stacktrace
*graceful handling of large files - should we just send GPT relevant classes / functions?
