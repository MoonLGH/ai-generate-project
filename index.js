
const openai = require('openai');
require("dotenv/config");
let prompt = "You are a programmer. Create a project of 'XXXXX'. Don't send the code all in one. Firstly, I want you to send the project folder structure as JSON with a rule of 'if x is folder, put the files inside; if it's a file, then write 'file' in its key'. Example: {'src':{'index.js':'file'}}. What I will do is ask for specific files, and what you need to do is just send the code, not anything else.";
const apiKey = process.env.OPENAI
const model = 'text-davinci-003';

const configuration = new openai.Configuration({
    apiKey,
  });
const client = new openai.OpenAIApi(configuration);

async function generateProjectFolderStructure(projectName) {
  const promptWithProjectName = prompt.replace('XXXXX', projectName);
  prompt = prompt.replace('XXXXX', projectName)
  const input = {
    model,
    prompt: promptWithProjectName,
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };
  const output = await client.createCompletion(input);
  console.log(output.data.choices[0].text)
  prompt = prompt + "-- \n" + output.data.choices[0].text + "\n--"
  const projectFolderStructure = JSON.parse(output.data.choices[0].text.trim());
  return projectFolderStructure;
}


const fs = require('fs');
const path = require('path');

async function createProject(projectName) {
  const projectFolderStructure = await generateProjectFolderStructure(projectName);
  createFolderStructure(projectFolderStructure, projectName);
}

function createFolderStructure(folderStructure, projectName) {
  for (let folderName in folderStructure) {
    const fullPath = path.join(projectName, folderName);
    if (folderStructure[folderName] === 'file') {
      fs.writeFileSync(fullPath, generateCodeForFile(fullPath));
    } else {
      fs.mkdirSync(fullPath);
      createFolderStructure(folderStructure[folderName], fullPath);
    }
  }
}


async function generateCodeForFile(filePath) {
  const pathParts = filePath.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const dirPath = pathParts.slice(0, pathParts.length - 1).join('/');
  const fileQuery = `Show me the code for ${fileName} in ${dirPath}.`;
  const promptWithFileQuery = prompt + `\n-- \n${fileQuery}\n--`;
  const input = {
    model,
    prompt: promptWithFileQuery,
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };
  const output = await client.createCompletion(input);
  const fileCode = output.data.choices[0].text.trim();
  return fileCode;
}

async function createFolderStructure(folderStructure, projectName) {
  for (let folderName in folderStructure) {
    const fullPath = path.join(projectName, folderName);
    if (folderStructure[folderName] === 'file') {
      const code = await generateCodeForFile(fullPath);
      fs.writeFileSync(fullPath, code);
    } else {
      if(!fs.existsSync(fullPath)){
        let folders = fullPath.split('/');
        if(!fs.existsSync(folders[0])){
          fs.mkdirSync(folders[0]);
        }
        for(let i = 1; i < folders.length; i++){
          if(!fs.existsSync(folders[0]+"/"+folders[i])){
            fs.mkdirSync(folders[0]+"/"+folders[i]);
          }
        }
      }
      if(!fs.existsSync(fullPath)){
        fs.mkdirSync(fullPath);
      }
      createFolderStructure(folderStructure[folderName], fullPath);
    }
  }
}

createProject("React Clock App")