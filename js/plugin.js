const fs = require("fs");
const base64 = require("base64-js");
const { default: ollama } = require('ollama'); // CJS

const saveApiKeyButton = document.getElementById('saveApiKey');
const apiKeyInput = document.getElementById('apiKey');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const statusElement = document.getElementById('status');

apiKeyInput.addEventListener('paste', (event) => {
  event.preventDefault(); // Prevent the default paste behavior
  const textFromClipboard = eagle.clipboard.readText();
  apiKeyInput.value = textFromClipboard; // Replace the current value with the pasted text
});

document.getElementById('apiProvider').addEventListener('change', () => {
  const apiProvider = document.getElementById('apiProvider').value;
  checkStatus(0);
  if (localStorage.getItem(`${apiProvider}apiKey`)) {
    document.getElementById('apiKey').placeholder = `API Key Stored`;
  } else {
    document.getElementById('apiKey').placeholder = `Enter API Key`;
  }
});

// Function to save API Key
saveApiKeyButton.addEventListener('click', async () => {
  const apiProvider = document.getElementById('apiProvider').value;
  const apiKey = document.getElementById(`apiKey`);
  console.log(`${apiProvider}apiKey`);
  if (apiKey) {
    localStorage.setItem(`${apiProvider}apiKey`, apiKey.value);
    console.log(`Saving API Key for ${apiProvider}:`, apiKey.value);
    document.getElementById('apiKey').value = ``;
    document.getElementById('apiKey').placeholder = `API Key Stored`;
    checkStatus(0); // Clear after 5 seconds
  } else {
    checkStatus(0); // Clear after 5 seconds
  }
});

// Clear API Key
const clearApiKeyButton = document.getElementById('clearApiKey');
clearApiKeyButton.addEventListener('click', () => {
  const apiProvider = document.getElementById('apiProvider').value;
  localStorage.removeItem(`${apiProvider}apiKey`);
  console.log(`Clearing API Key for ${apiProvider}`);
  document.getElementById('apiKey').placeholder = `Enter API Key`;
  checkStatus(0); // Clear after 5 seconds
});

// Function to toggle API key elements visibility
function toggleOllama() {
  const useOllamaToggle = document.getElementById('useOllama').checked;
  document.getElementById('apiKeyMenu').style.display = useOllamaToggle ? 'none' : '';

  if (useOllamaToggle) {
    document.getElementById('localOptions').style.display = 'block';
    checkStatus(0);
  } else {
    document.getElementById('localOptions').style.display = 'none';
    checkStatus(0);
  }
}



// Add event listener to the useOllama checkbox
document.getElementById('useOllama').addEventListener('change', toggleOllama);

// Initial call to set the correct display on page load
toggleOllama();

const customModelNameInput = document.getElementById('customModelName');
const downloadModelButton = document.getElementById('downloadModel');

downloadModelButton.addEventListener('click', async () => {
  document.getElementById('cancelProcess').style.display = 'inherit';
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressBar').style.backgroundColor = '#007BFF';
  document.getElementById('progressBarContainer').classList.add('sheen');
  const modelName = customModelNameInput.value;
  if (modelName) {
    try {
      statusElement.textContent = `Downloading Model...`;
      let currentDigestDone = false;
      const stream = await ollama.pull({ model: modelName, stream: true });
      for await (const part of stream) {
        if (part.digest) {
          let percent = 0;
          if (part.completed && part.total) {
            percent = Math.round((part.completed / part.total) * 100);
          }
          statusElement.textContent = `Downloading ${modelName} ${percent}%...`;
          document.getElementById('progressBar').style.width = `${percent}%`;
          if (percent === 100 && !currentDigestDone) {
            statusElement.textContent = `Download complete.`;
            currentDigestDone = true;
          } else {
            currentDigestDone = false;
          }
        } else {
          statusElement.textContent = part.status;
        }
      }
      console.log(`Model ${modelName} loaded successfully.`);
      populateOllamaModels(); // Refresh the model list
      customModelNameInput.value = ''; // Clear the input
    } catch (error) {
      if (isCancelled) {
        statusElement.textContent = 'Download cancelled.';
      } else {
        console.error(`Error pulling model ${modelName}:`, error);
        statusElement.textContent = `Error downloading model ${modelName}`;
      }
      checkStatus(5000); // Clear after 5 seconds
    } finally {
      isCancelled = false; // Reset the flag
    }
  }
});

let isCancelled = false;

async function checkStatus(delay) {
  setTimeout(async () => {
    if (document.getElementById('useOllama').checked) {

      apiKeyStatus.innerHTML = '<i class="fa fa-key" style="color:rgb(128,128,128);"></i>';
      document.getElementById('localOptions').style.display = 'block';
      try {
        const response = await ollama.ps();
        if (response.models.length > 0) {
          statusElement.textContent = `${response.models[0].name} loaded.`;
        } else {
          statusElement.textContent = 'Model will load on next run.';
        }
      } catch (error) {
        console.error('Error checking model status:', error);
        statusElement.textContent = 'Error checking model status.';
      }
    }
    else {
      const apiProvider = document.getElementById('apiProvider').value;
      const storedApiKey = localStorage.getItem(`${apiProvider}apiKey`);
      if (storedApiKey) {
        apiKeyStatus.innerHTML = '<i class="fa fa-key" style="color:#00c040;"></i>';
        statusElement.innerHTML = 'Ready when you are...';
        document.getElementById('apiKey').placeholder = `API Key Stored`;
      } else {
        apiKeyStatus.innerHTML = '<i class="fa fa-key" style="color:rgb(150, 21, 21);"></i>';
        statusElement.innerHTML = 'Please add API Key.';
        document.getElementById('apiKey').placeholder = `Enter API Key`;
      }
    }
  }, delay);
}

function processabort() {
  statusElement.textContent = 'Process cancelled.';
  // Disable the sheen after all files have been processed
  document.getElementById('progressBarContainer').classList.add('no-sheen');
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('cancelProcess').style.display = 'none';
  isCancelled = true;
  ollama.abort();
  checkStatus(1500);
}

async function populateOllamaModels() {
  const ollamaModelSelect = document.getElementById('ollamaModel');
  ollamaModelSelect.innerHTML = ''; // Clear existing options
  const response = await ollama.list();
  const availableModels = response.models.map(model => model.name);

  availableModels.forEach(modelName => {
    const option = document.createElement('option');
    option.value = modelName;
    option.text = modelName;
    ollamaModelSelect.add(option);
  });
  const savedSettings = localStorage.getItem('pluginSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    document.getElementById('ollamaModel').value = settings.ollamaModel;
  }
}

function getMimeType(extension) {
  const mimeTypes = {
    'jpg': "image/jpeg",
    'jpeg': "image/jpeg",
    'png': "image/png",
    'gif': "image/gif",
    'webp': "image/webp",
    'bmp': "image/bmp",
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

document.getElementById('cancelButton').addEventListener('click', processabort);

eagle.onPluginCreate(async (plugin) => {
  const runButton = document.getElementById('run');
  const apiKeyStatus = document.getElementById('apiKeyStatus');
  const tagsElement = document.getElementById('processLogBox');

  // Initialize an empty array to store the log of processed items
  let processedItemsLog = [];

  runButton.addEventListener('click', async () => {
    document.getElementById('cancelProcess').style.display = 'inherit';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressBarContainer').classList.add('sheen');
    document.getElementById('progressBar').style.backgroundColor = '#007BFF';

    const apiProvider = document.getElementById('apiProvider').value;
    const myAPI = localStorage.getItem(`${apiProvider}apiKey`);
    if (!myAPI && !document.getElementById('useOllama').checked) {
      apiKeyStatus.innerHTML = '<i class="fa fa-key" style="color:rgb(150, 21, 21);"></i>';
      statusElement.innerHTML = 'Please add API Key.';
      checkStatus(5000); // Clear after 5 seconds
      return;
    }
    try {
      const selectedItems = await eagle.item.getSelected();
      if (!selectedItems || selectedItems.length === 0) {
        statusElement.textContent = 'No items selected.';
        checkStatus(5000); // Clear after 5 seconds
        return;
      }
      const useOllamaToggle = document.getElementById('useOllama');
      useOllamaToggle.addEventListener('change', () => {
        console.log('Use Ollama:', useOllamaToggle.checked);
      });

      const useThumbnail = document.getElementById('useThumbnail').checked;
      const filePaths = useThumbnail
        ? selectedItems.map(item => item.thumbnailPath)
        : selectedItems.map(item => item.filePath);
      let img_urls = filePaths;
      let imagesBase64 = filePaths.map(path => base64.fromByteArray(fs.readFileSync(path)));
      let mimeTypes = useThumbnail
        ? filePaths.map(() => 'image/webp')
        : filePaths.map(path => getMimeType(path.split('.').pop()));
      let urls = imagesBase64.map(imageBase64 => `data:${mimeTypes};base64,${imageBase64}`);

      for (let i = 0; i < urls.length; i++) {
        if (isCancelled) {
          processabort();
          break;
        }

        const url = urls[i];
        const img_url = img_urls[i];
        const item = selectedItems[i];
        const mimeType = mimeTypes[i];
        const ollamaModel = document.getElementById('ollamaModel').value;
        statusElement.textContent = `Processing ${item.name}.${item.ext} (${i + 1}/${urls.length})`;
        const prompt = "Create a comma separated list of" + (document.getElementById('enableTagLimit').checked ? ` ${document.getElementById('tagLimit').value}` : "") + " keywords for the image, in order of confidence. Don't use any other text. Keep keywords singular, not plural.";

        console.log(img_url);

        try {
          let responseText;
          if (useOllamaToggle.checked) {
            const response = await ollama.chat({
              model: ollamaModel,
              system: 'You are an expert at generating tags for images. you only respond with a comma separated list of tags, in order of confidence. DO NOT respond with numbered or bulleted lists.',
              options: {
                temperature: 1,
                max_tokens: 500,
                repeat_penalty: 1.1,
              },
              messages: [{
                role: 'user',
                content: prompt,
                images: [img_url]
              }]
            });
            responseText = response.message.content;
          } else if (document.getElementById('apiProvider').value === 'openai') {
            const requestBody = {
              model: "gpt-4o",
              temperature: 0.2,
              max_tokens: 500,
              messages: [{
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: {
                      "url": url,
                      "detail": "low",
                    },
                  },
                ],
              }],
            }
            console.log('OpenAI API Request text:', requestBody.messages[0].content[0].text);
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${myAPI}`
              },
              body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            responseText = data.choices[0].message.content;
          } else if (document.getElementById('apiProvider').value === 'gemini') {

            const requestBody = {
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: imagesBase64[i] } }
                ]
              }]
            };

            console.log('Gemini API Request text:', requestBody.contents[0].parts[0].text);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${myAPI}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            responseText = data.candidates[0].content.parts[0].text;
          } else if (document.getElementById('apiProvider').value === 'claude') {
            const requestBody = {
              model: "claude-3-haiku-20240307",
              max_tokens: 4000,
              messages: [{
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image", source: { type: "base64", media_type: mimeType, data: imagesBase64[i] } }
                ]
              }]
            };

            console.log('Claude API Request text:', requestBody.messages[0].content[0].text);

            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': myAPI,
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            if (!response.ok) {
              throw new Error(`API request failed: ${data.error?.message || response.statusText}`);
            }
            responseText = data.content[0]?.text || '';
            if (!responseText) {
              console.error('Unexpected API response:', data);
              throw new Error('Unexpected API response format');
            }
          }

          const tagsReturned = responseText.split(',').map(tag => tag.trim());
          console.log(responseText); // Log the response text

          // Extract keywords and add as tags
          const enableTagLimit = document.getElementById('enableTagLimit').checked;
          const tagLimit = enableTagLimit ? document.getElementById('tagLimit').value || Infinity : Infinity;
          const tagsToAdd = responseText.split(',').map(tag => tag.trim()).slice(0, tagLimit);

          // Filter out any tags that already exist in the item's tags or replace all tags if the checkbox is checked
          const replaceTags = document.getElementById('replaceTags').checked;
          const newTags = replaceTags ? tagsToAdd : tagsToAdd.filter(tag => !item.tags.includes(tag));

          if (newTags.length > 0) {
            if (replaceTags) {
              item.tags = newTags; // Replace all tags
            } else {
              item.tags.push(...newTags); // Add new tags
            }
            item.save();
            statusElement.textContent = `Processing Complete.`;
          } else {
            statusElement.textContent = 'No new tags to add.';
          }

          // Update progress bar width after processing is complete
          const progressPercentage = ((i + 1) / urls.length) * 100;
          document.getElementById('progressBar').style.width = `${progressPercentage}%`;

          // Append the processed item to the log
          processedItemsLog.push(`<b>Last tagged '${item.name}.${item.ext}'</b>: <br> ${tagsReturned.join(', ')}`);
          tagsElement.innerHTML = processedItemsLog.join('<br><br>');

        } catch (error) {
          document.getElementById('log').innerHTML = error;
          statusElement.textContent = 'An error occurred.';
        }
      }
      // Reset the isCancelled flag after the loop
      isCancelled = false;
      // Disable the sheen after all files have been processed
      document.getElementById('progressBarContainer').classList.add('no-sheen');
      document.getElementById('cancelProcess').style.display = 'none';
      document.getElementById('progressBar').style.backgroundColor = '#00c040';
    } catch (error) {
      console.error('Error:', error);
      checkStatus(5000); // Clear after 5 seconds
    }
  });
});

function toggleTagLimitVisibility() {
  const tagLimitSlider = document.getElementById('tagLimit');
  const tagLimitOutput = document.getElementById('tagLimitOutput');
  const isChecked = document.getElementById('enableTagLimit').checked;

  tagLimitSlider.disabled = !isChecked;
  tagLimitOutput.style.opacity = isChecked ? '1' : '0.5';
  tagLimitOutput.style.color = isChecked ? '#007BFF' : '#555555';
}

// Initial call to set the correct display on page load
toggleTagLimitVisibility();

const settingsButton = document.getElementById('settingsButton');
const settingsWindow = document.getElementById('settingsWindow');

settingsButton.addEventListener('click', () => {
  settingsWindow.classList.toggle('visible');
});

document.addEventListener('click', (event) => {
  const withinBoundaries = apiKeyMenu.contains(event.target) || settingsButton.contains(event.target);

  if (!withinBoundaries) {
    apiKeyMenu.classList.remove('visible');
  }
});

// Add functionality to the close button to close the window
document.getElementById('closeButton').addEventListener('click', () => {
  window.close(); // This assumes you have the ability to close the window directly
});

document.getElementById('searchButton').addEventListener('click', () => {
  eagle.shell.openExternal('https://ollama.com/library');
});

document.getElementById('ollamaModel').addEventListener('change', () => {
  checkStatus(0);
});

document.getElementById('showProcessLog').addEventListener('change', () => {
  if (document.getElementById('showProcessLog').checked) {
    document.getElementById('processLog').style.display = 'flex';
  } else {
    document.getElementById('processLog').style.display = '';
  }
});

document.getElementById('clearProcessLog').addEventListener('click', () => {
  document.getElementById('processLogBox').innerHTML = '';
});

// Save settings to localStorage when changed
function saveSettings() {
  const settings = {
    enableTagLimit: document.getElementById('enableTagLimit').checked,
    tagLimit: document.getElementById('tagLimit').value,
    useThumbnail: document.getElementById('useThumbnail').checked,
    replaceTags: document.getElementById('replaceTags').checked,
    ollamaModel: document.getElementById('ollamaModel').value,
    useOllama: document.getElementById('useOllama').checked,
    showProcessLog: document.getElementById('showProcessLog').checked,
    apiProvider: document.getElementById('apiProvider').value,
  };
  localStorage.setItem('pluginSettings', JSON.stringify(settings));
}

// Add event listeners to save settings when changed
document.getElementById('enableTagLimit').addEventListener('change', saveSettings);
document.getElementById('tagLimit').addEventListener('input', saveSettings);
document.getElementById('useThumbnail').addEventListener('change', saveSettings);
document.getElementById('replaceTags').addEventListener('change', saveSettings);
document.getElementById('ollamaModel').addEventListener('change', saveSettings);
document.getElementById('useOllama').addEventListener('change', saveSettings);
document.getElementById('showProcessLog').addEventListener('change', saveSettings);
document.getElementById('apiProvider').addEventListener('change', saveSettings);

// Load settings from localStorage when the plugin is opened
document.addEventListener('DOMContentLoaded', async () => {
  const savedSettings = localStorage.getItem('pluginSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    document.getElementById('enableTagLimit').checked = settings.enableTagLimit;
    document.getElementById('tagLimit').value = settings.tagLimit;
    document.getElementById('useThumbnail').checked = settings.useThumbnail;
    document.getElementById('replaceTags').checked = settings.replaceTags;
    document.getElementById('ollamaModel').value = settings.ollamaModel;
    document.getElementById('useOllama').checked = settings.useOllama;
    document.getElementById('showProcessLog').checked = settings.showProcessLog;
    document.getElementById('apiProvider').value = settings.apiProvider;
    toggleTagLimitVisibility(); // Update tag limit visibility based on loaded setting
    toggleOllama(); // Update the visibility of API key elements based on the loaded setting
    checkStatus(0);
    populateOllamaModels();
    document.getElementById('processLog').style.display = settings.showProcessLog ? 'flex' : ''
  }
});