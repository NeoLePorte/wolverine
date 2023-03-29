const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");
const { sendErrorToGpt4, runScript, applyChanges } = require("./wolverine");

jest.mock("fs");
jest.mock("openai");

describe("runScript", () => {
  beforeEach(() => {
    fs.spawnSync.mockReset();
  });

  it("calls spawnSync with the expected parameters", () => {
    const expectedScriptName = "script.js";
    const expectedArgs = ["arg1", "arg2"];
    const expectedOptions = { encoding: "utf-8" };

    runScript(expectedScriptName, expectedArgs);

    expect(fs.spawnSync).toHaveBeenCalledWith(
      process.execPath,
      [expectedScriptName, ...expectedArgs],
      expectedOptions
    );
  });

  it("returns the output and return code", () => {
    const expectedOutput = "output content";
    const expectedReturnCode = 0;

    fs.spawnSync.mockReturnValueOnce({
      stdout: "",
      stderr: "",
      status: expectedReturnCode,
    });
    fs.spawnSync.mockReturnValueOnce({
      stdout: expectedOutput,
      stderr: "",
      status: expectedReturnCode,
    });

    let result = runScript("script.js", ["arg1", "arg2"]);
    expect(result.output).toBe(expectedOutput);
    expect(result.returnCode).toBe(expectedReturnCode);

    result = runScript("script.js", ["arg1", "arg2"]);
    expect(result.output).toBe(expectedOutput);
    expect(result.returnCode).toBe(expectedReturnCode);
  });
});

describe('sendErrorToGpt4', () => {
    beforeEach(() => {
      fs.readFileSync.mockReset();
      fs.readFileSync.mockReturnValue('dummy-key');
      openai.createChatCompletion.mockReset();
    });
  
    it('calls createChatCompletion with the expected parameters', async () => {
      const expectedPrompt = 'prompt text';
      const expectedModel = 'gpt-3.5-turbo';
      const expectedMessages = [{ role: 'user', content: expectedPrompt }];
      const expectedTemperature = 1.0;
      const expectedApiKey = 'dummy-key';
  
      fs.readFileSync.mockReturnValueOnce(expectedPrompt);
      openai.createChatCompletion.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'response' } }],
        },
      });
  
      const configuration = new Configuration({ apiKey: expectedApiKey });
      const openai = new OpenAIApi(configuration);
  
      await sendErrorToGpt4('file/path', ['arg1', 'arg2'], 'error message');
  
      expect(openai.createChatCompletion).toHaveBeenCalledWith({
        model: expectedModel,
        messages: expectedMessages,
        temperature: expectedTemperature,
      });
    });
  
    it('returns the response content', async () => {
      const expectedResponse = 'response content';
  
      openai.createChatCompletion.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: expectedResponse } }],
        },
      });
  
      const result = await sendErrorToGpt4(
        'file/path',
        ['arg1', 'arg2'],
        'error message'
      );
  
      expect(result).toBe(expectedResponse);
    });
  });

describe("applyChanges", () => {
  beforeEach(() => {
    fs.readFileSync.mockReset();
    fs.writeFileSync.mockReset();
  });

  it("updates the file with the expected changes", () => {
    const expectedFilePath = "file/path";
    const expectedOriginalFileContent = "original file content";
    const expectedChangesJson =
      '[{"operation":"Replace","line":1,"content":"new content"}]';
    const expectedNewFileContent = "new content";

    fs.readFileSync.mockReturnValueOnce(expectedOriginalFileContent);
    fs.readFileSync.mockReturnValueOnce(expectedChangesJson);

    applyChanges(expectedFilePath, expectedChangesJson);

    expect(fs.readFileSync).toHaveBeenCalledWith(expectedFilePath, "utf-8");
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expectedFilePath,
      expectedNewFileContent
    );
  });
});
