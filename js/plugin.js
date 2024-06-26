//#region Variables
const fs = require("fs");
const base64 = require("base64-js");
const { default: ollama } = require('ollama'); // CJS
const saveApiKey = document.getElementById('saveApiKey');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const apiProvider = document.getElementById('apiProvider');
const apiKey = document.getElementById(`apiKey`);
const apiKeyMenu = document.getElementById('apiKeyMenu');
const apiSettings = document.getElementById('apiSettings');
const statusElement = document.getElementById('status');
const customModelName = document.getElementById('customModelName');
const newItem = document.getElementById('newItem');
const addItemBtn = document.getElementById('addItem');
const tagCatContainer = document.getElementById('tagCatContainer');
const tagCat = document.getElementById('tagCat');
const tagCatChk = document.getElementById('tagCatChk');
const localOptions = document.getElementById('localOptions');
const clearApiKeyButton = document.getElementById('clearApiKey');
const textFromClipboard = eagle.clipboard.readText();
const sortableList = document.getElementById('sortableList');
const savedSettings = localStorage.getItem('pluginSettings');
const ollamaModel = document.getElementById('ollamaModel');
const settingsBtn = document.getElementById('settingsButton');
const closeBtn = document.getElementById('closeButton');
const cancelBtn = document.getElementById('cancelButton');
const cancelProcess = document.getElementById('cancelProcess');
const searchBtn = document.getElementById('searchButton');
const pLogClear = document.getElementById('pLogClear');
const pLogContainer = document.getElementById('pLogContainer');
const pLogText = document.getElementById('pLogText');
const pLogShow = document.getElementById('pLogShow');
const enableTagLimit = document.getElementById('enableTagLimit');
const tagLimitOutput = document.getElementById('tagLimitOutput');
const tagLimit = document.getElementById('tagLimit');
const useThumbnail = document.getElementById('useThumbnail');
const replaceTags = document.getElementById('replaceTags');
const preLoadModel = document.getElementById('preLoadModel');
const progressBar = document.getElementById('progressBar');
const progressBarContainer = document.getElementById('progressBarContainer');
const settingsWindow = document.getElementById('settingsWindow');
const downloadBtn = document.getElementById('downloadModel');
const deleteModelBtn = document.getElementById('deleteModelButton');
const runButton = document.getElementById('run');
const settings = JSON.parse(savedSettings);
//#endregion

//#region Event Listeners
// Add event listeners to save settings when changed
apiKey.addEventListener('paste', (event) => {
  event.preventDefault(); // Prevent the default paste behavior
  apiKey.value = textFromClipboard; // Replace the current value with the pasted text
});

customModelName.addEventListener('paste', (event) => {
  event.preventDefault(); // Prevent the default paste behavior
  customModelName.value = textFromClipboard; // Replace the current value with the pasted text
});

newItem.addEventListener('paste', (event) => {
  event.preventDefault(); // Prevent the default paste behavior
  newItem.value = textFromClipboard; // Replace the current value with the pasted text
});

apiProvider.addEventListener('change', () => {
  saveSettings();
  checkStatus(0);
});

settingsBtn.addEventListener('click', () => {
  settingsWindow.classList.toggle('visible');
});

document.addEventListener('click', (event) => {
  const withinBoundaries = apiKeyMenu.contains(event.target) || settingsBtn.contains(event.target);

  if (!withinBoundaries) {
    apiKeyMenu.classList.remove('visible');
  }
});

downloadBtn.addEventListener('click', async () => {
  await downloadModel();
});

// Add functionality to the close button to close the window
closeBtn.addEventListener('click', () => {
  window.close(); // This assumes you have the ability to close the window directly
});

searchBtn.addEventListener('click', () => {
  eagle.shell.openExternal('https://ollama.com/library');
});

pLogClear.addEventListener('click', () => {
  pLogText.innerHTML = '';
});


function toggleTagCat() {
  tagCat.style.display = tagCatChk.checked ? 'block' : 'none';

  if (tagCatChk.checked) {
    tagCat.style.display = 'block';
  } else {
    tagCat.style.display = 'none';
  }
}

// Function to save API Key
saveApiKey.addEventListener('click', async () => {
  console.log(`${apiProvider.value}apiKey`);
  if (apiKey) {
    localStorage.setItem(`${apiProvider.value}apiKey`, apiKey.value);
    console.log(`Saving API Key for ${apiProvider}:`, apiKey.value);
    apiKey.value = ``;
    apiKey.placeholder = `API Key Stored`;
    checkStatus(0); // Clear after 5 seconds
  } else {
    checkStatus(0); // Clear after 5 seconds
  }
});

// Clear API Key
clearApiKeyButton.addEventListener('click', () => {
  localStorage.removeItem(`${apiProvider.value}apiKey`);
  console.log(`Clearing API Key for ${apiProvider.value}`);
  apiKey.placeholder = `Enter API Key`;
  checkStatus(0); // Clear after 5 seconds
});

enableTagLimit.addEventListener('change', saveSettings);
tagLimit.addEventListener('input', saveSettings);
useThumbnail.addEventListener('change', saveSettings);
replaceTags.addEventListener('change', saveSettings);
ollamaModel.addEventListener('change', () => {
  saveSettings();
  checkStatus(0);
});
pLogShow.addEventListener('change', () => {
  saveSettings();
  if (pLogShow.checked) {
    pLogContainer.style.display = 'flex';
  } else {
    pLogContainer.style.display = '';
  }
});
preLoadModel.addEventListener('change', () => {
  saveSettings();
  checkStatus(0);
});

tagCatChk.addEventListener('change', () => {
  saveSettings();
  toggleTagCat();
});

cancelBtn.addEventListener('click', processabort);


// Load settings from localStorage when the plugin is opened
document.addEventListener('DOMContentLoaded', async () => {

  if (savedSettings) {
    enableTagLimit.checked = settings.enableTagLimit;
    tagLimit.value = settings.tagLimit;
    useThumbnail.checked = settings.useThumbnail;
    replaceTags.checked = settings.replaceTags;

    if (ollamaModel.options.length > 0) {
      if (settings.ollamaModel && Array.from(models).some(option => option.value === settings.ollamaModel)) {
        ollamaModel.value = settings.ollamaModel;
      } else {
        ollamaModel.selectedIndex = 0;
      }
    } else {
      statusElement.textContent = 'No models installed';
    }

    pLogShow.checked = settings.pLogShow;
    apiProvider.value = settings.apiProvider;
    toggleTagLimitVisibility();
    pLogContainer.style.display = settings.pLogShow ? 'flex' : '';
    preLoadModel.checked = settings.preLoadModel;
    checkStatus(0);
    tagCatChk.checked = settings.tagCatChk;
    toggleTagCat();
  }
});

document.addEventListener('DOMContentLoaded', function () {

  // Function to add a new item
  function addItem() {
    const itemText = newItem.value.trim();
    if (itemText) {
      const li = createListItem(itemText);
      sortableList.appendChild(li);
      newItem.value = '';
      saveList();
    }
  }

  // Function to create a list item
  function createListItem(text) {
    const li = document.createElement('li');
    li.draggable = true;
    li.innerHTML = `
      <span>${text}</span>
      <button class="deleteItem"><i class="fa fa-trash" aria-hidden="true"></i></button>
    `;
    li.querySelector('.deleteItem').addEventListener('click', function () {
      li.remove();
      saveList();
    });
    return li;
  }

  // Add item when button is clicked
  addItemBtn.addEventListener('click', addItem);

  // Add item when Enter key is pressed
  newItem.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      addItem();
    }
  });

  // Drag and drop functionality
  let draggedItem = null;

  sortableList.addEventListener('dragstart', function (e) {
    draggedItem = e.target;
    setTimeout(() => e.target.style.display = 'none', 0);
  });

  sortableList.addEventListener('dragend', function (e) {
    setTimeout(() => {
      e.target.style.display = '';
      draggedItem = null;
      saveList(); // Save the list after drag and drop
    }, 0);
  });

  sortableList.addEventListener('dragover', function (e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(sortableList, e.clientY);
    const currentItem = draggedItem;
    if (afterElement == null) {
      sortableList.appendChild(currentItem);
    } else {
      sortableList.insertBefore(currentItem, afterElement);
    }
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Save list to localStorage
  function saveList() {
    const items = Array.from(sortableList.children).map(li => li.querySelector('span').textContent);
    localStorage.setItem('tagCat', JSON.stringify(items));
  }

  // Load list from localStorage
  function loadList() {
    const items = JSON.parse(localStorage.getItem('tagCat') || '[]');
    sortableList.innerHTML = ''; // Clear existing items
    items.forEach(item => {
      const li = createListItem(item);
      sortableList.appendChild(li);
    });
  }

  // Load the list when the page loads
  loadList();
});
//#endregion

//#region Functions
// Save settings to localStorage when changed
function saveSettings() {
  const settings = {
    enableTagLimit: enableTagLimit.checked,
    tagLimit: tagLimit.value,
    useThumbnail: useThumbnail.checked,
    replaceTags: replaceTags.checked,
    ollamaModel: ollamaModel.value,
    pLogShow: pLogShow.checked,
    apiProvider: apiProvider.value,
    preLoadModel: preLoadModel.checked,
    tagCatChk: tagCatChk.checked,
  };
  localStorage.setItem('pluginSettings', JSON.stringify(settings));
}

async function preloadModel(modelName) {
  if (!modelName) {
    console.error('No model selected');
    statusElement.textContent = 'Error: No model selected';
    return;
  }
  try {
    statusElement.textContent = `Loading ${modelName}...`;
    progressLoading();

    let progress = 0;
    let isLoaded = false;

    const interval = setInterval(() => {
      if (progress < 99 && !isLoaded) {
        const increment = Math.max(1, 5 - Math.floor(progress / 5));
        progress += increment;
        progressBar.style.width = `${progress}%`;
        statusElement.textContent = `Loading ${modelName}`;
      } else if (isLoaded) {
        clearInterval(interval);
        progress = 100;
        progressDone()
        statusElement.textContent = `${modelName} loaded.`;
        console.log(`${modelName} loaded.`);
      }
    }, 120);

    const loadModel = async () => {
      await ollama.chat({
        model: modelName,
        messages: [{ role: 'system', content: 'Preloading model' }],
        stream: false
      });
    };

    await loadModel();
    isLoaded = true;
    cancelProcess.style.display = 'none';

  } catch (error) {
    console.error(`Error loading ${modelName}:`, error);
    statusElement.textContent = `Error loading ${modelName}`;
  }
}

function progressLoading() {
  cancelProcess.style.display = 'inherit';
  progressBar.style.width = '0%';
  progressBar.style.backgroundColor = '#007BFF';
  progressBarContainer.classList.add('sheen');
}

function progressDone() {
  progressBar.style.width = '100%';
  progressBar.style.backgroundColor = '#00c040';
  progressBarContainer.classList.remove('sheen');
  cancelProcess.style.display = 'none';
}

async function downloadModel() {
  progressLoading();
  const modelName = customModelName.value;
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
          progressBar.style.width = `${percent}%`;
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
      populateOllamaModels(); // Refresh the model list
      customModelName.value = ''; // Clear the input
      checkStatus(1500); // Clear after 5 seconds
      cancelProcess.style.display = 'none';
      progressBarContainer.classList.remove('sheen');
    } catch (error) {
      if (isCancelled) {
        statusElement.textContent = 'Download cancelled.';
      } else {
        console.error(`Error pulling model ${modelName}:`, error);
        statusElement.textContent = `Error downloading model ${modelName}`;
      }
    } finally {
      isCancelled = false; // Reset the flag
      progressBarContainer.classList.remove('sheen');
    }
  }

}

let isCancelled = false;

async function checkStatus(delay) {
  await new Promise(resolve => setTimeout(resolve, delay));

  if (apiProvider.value === 'ollama') {
    apiKeyStatus.innerHTML = '<i class="fa fa-key" style="color:rgb(128,128,128);"></i>';
    localOptions.style.display = 'block';
    apiSettings.style.display = 'none';
    try {
      const modelsAvailable = await populateOllamaModels();
      if (!modelsAvailable) {
        return; // Exit early if no models are available
      }
      const modelName = ollamaModel.value;
      if (!modelName) {
        throw new Error('No model selected');
      }
      const response = await ollama.ps();
      if (response.models.length > 0) {
        if (response.models[0].name === modelName) {
          statusElement.textContent = `${modelName} loaded.`;
          console.log(`${modelName} already loaded.`);
          progressDone()
        } else {
          if (preLoadModel.checked) {
            await preloadModel(modelName);
          }
          else {
            statusElement.textContent = 'Model will load on next run.';
            progressBar.style.width = '0%';
          }
        }
      } else {
        if (preLoadModel.checked) {
          await preloadModel(modelName);
        }
        else {
          statusElement.textContent = 'Model will load on next run.';
          progressBar.style.width = '0%';
        }
      }
    } catch (error) {
      console.error('Error checking model status:', error);
      statusElement.textContent = 'No Model Selected.';
    }
  }
  else {
    localOptions.style.display = 'none';
    apiSettings.style.display = 'block';
    const storedApiKey = localStorage.getItem(`${apiProvider.value}apiKey`);
    if (storedApiKey) {
      apiKeyStatus.innerHTML = '<i class="fa fa-key" style="color:#00c040;"></i>';
      statusElement.innerHTML = 'Ready when you are...';
      progressBar.style.backgroundColor = '#007BFF';
      apiKey.placeholder = `API Key Stored`;
    } else {
      apiKeyStatus.innerHTML = '<i class="fa fa-key" style="color:rgb(150, 21, 21);"></i>';
      statusElement.innerHTML = 'Please add API Key.';
      apiKey.placeholder = `Enter API Key`;
    }
  }
}

function processabort() {
  statusElement.textContent = 'Process cancelled.';
  // Disable the sheen after all files have been processed
  progressBarContainer.classList.add('no-sheen');
  progressBar.style.width = '0%';
  cancelProcess.style.display = 'none';
  isCancelled = true;
  ollama.abort();
  checkStatus(1500);
}

async function populateOllamaModels() {
  ollamaModel.innerHTML = ''; // Clear existing options
  try {
    const response = await ollama.list();
    const availableModels = response.models.map(model => model.name);

    if (availableModels.length === 0) {
      statusElement.textContent = 'No models installed';
      deleteModelBtn.disabled = true;
      deleteModelBtn.style.backgroundColor = 'rgb(128, 128, 128)';
      return false;
    }

    availableModels.forEach(modelName => {
      const option = document.createElement('option');
      option.value = modelName;
      option.text = modelName;
      ollamaModel.add(option);
    });
    const savedSettings = localStorage.getItem('pluginSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      ollamaModel.value = settings.ollamaModel;
    }

    deleteModelBtn.disabled = false;
    deleteModelBtn.style.backgroundColor = '';
    // Add event listener for delete button
    deleteModelBtn.addEventListener('click', async () => {
      const selectedModel = ollamaModel.value;
      if (selectedModel) {
        try {
          await ollama.delete({ model: selectedModel });
          console.log(`Deleted model: ${selectedModel}`);
          statusElement.textContent = `Deleted model: ${selectedModel}`;

          // Remove the deleted model from the select element
          const optionToRemove = ollamaModel.querySelector(`option[value="${selectedModel}"]`);
          if (optionToRemove) {
            ollamaModel.removeChild(optionToRemove);
          }

          // Select the first available option
          if (ollamaModel.options.length > 0) {
            ollamaModel.selectedIndex = 0;
          }

          // Refresh the model list
          await populateOllamaModels();
        } catch (error) {
          console.error(`Error deleting model ${selectedModel}:`, error);
          statusElement.textContent = `Error deleting model ${selectedModel}`;
        }
      } else {
        console.log('No model selected for deletion');
        statusElement.textContent = 'No model selected for deletion';
      }
    });

    return true;
  } catch (error) {
    console.error('Error populating Ollama models:', error);
    statusElement.textContent = 'Error loading models';
    return false;
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

function toggleTagLimitVisibility() {

  tagLimit.disabled = !enableTagLimit.checked;
  tagLimitOutput.style.opacity = enableTagLimit.checked ? '1' : '0.5';
  tagLimitOutput.style.color = enableTagLimit.checked ? '#007BFF' : '#555555';
}
//#endregion

eagle.onPluginCreate(async (plugin) => {

  // Initialize an empty array to store the log of processed items
  let processedItemsLog = [];

  runButton.addEventListener('click', async () => {
    progressLoading();

    const myAPI = localStorage.getItem(`${apiProvider.value}apiKey`);
    if (!myAPI && apiProvider.value !== 'ollama') {
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

      const filePaths = useThumbnail.checked
        ? selectedItems.map(item => item.thumbnailPath)
        : selectedItems.map(item => item.filePath);
      let img_urls = filePaths;
      let imagesBase64 = filePaths.map(path => base64.fromByteArray(fs.readFileSync(path)));
      let mimeTypes = useThumbnail.checked
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
        statusElement.textContent = `Processing ${item.name}.${item.ext} (${i + 1}/${urls.length})`;

        console.log(img_url);

        try {
          let prompt = "Create a comma separated list of" + (enableTagLimit.checked ? ` ${tagLimit.value}` : "") + " keywords for the image, in order of confidence. Don't use any other text. Keep keywords singular, not plural.";
          let responseText = '';
          const currentTagCat = JSON.parse(localStorage.getItem('tagCat') || '[]');
          let systemMsg = 'You are an expert at generating tags for images. The user will provide you with an image. You will generate a comma-separated list of' + (enableTagLimit.checked ? ` ${tagLimit.value}` : "") + ' keywords to describe the provided image in order of confidence. Don\'t use any other text. Keep keywords singular, not plural.';
          if (apiProvider.value === 'ollama' && tagCatChk.checked) {

            let allTags = new Set(); // Use a Set to automatically remove duplicates
            for (let i = 0; i < currentTagCat.length; i++) {
              const item = currentTagCat[i];
              const response = await ollama.chat({
                model: ollamaModel.value,
                options: {
                  temperature: 1,
                  max_tokens: 500,
                  repeat_penalty: 1.1,
                },
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert at generating tags for images. You only respond with a comma-separated list of tags in order of confidence.'
                  },
                  ...Array.from(allTags).map(tag => ({ role: 'assistant', content: tag })),
                  {
                    role: 'user',
                    content: `Create a comma-separated list of ${(enableTagLimit.checked ? ` ${tagLimit.value}` : "")} keywords about the ${item} of this image, in order of confidence. Don't use any other text. Keep keywords singular, not plural. Do not repeat any previously mentioned tags.`,
                    ...(i === 0 ? { images: [img_url] } : {}) // Only include the image for the first item
                  }
                ]
              });
              const newTags = response.message.content.split(',').map(tag => tag.trim());
              newTags.forEach(tag => allTags.add(tag)); // Add new tags to the Set
              console.log(`Response for ${item}:`, response.message.content);
            }
            responseText = Array.from(allTags).join(', '); // Convert Set back to string
            console.log(responseText);

          } else if (apiProvider.value === 'ollama' && !tagCatChk.checked) {
            const response = await ollama.chat({
              model: ollamaModel.value,
              messages: [{
                role: 'user',
                content: "Create "  + (enableTagLimit.checked ? "a" : "an extensive,") +  " comma separated list of " + (enableTagLimit.checked ? tagLimit.value : "") + " keywords for the subject(s), mood, tone and style, of this image. Keep keywords singular, not plural.",
                images: [img_url]
              }]
            });
            responseText = response.message.content;
            console.log(response, responseText);

          } else if (apiProvider.value === 'openai') {

            // Update prompt to include categories as a comma-separated list
            if (tagCatChk.checked && currentTagCat.length > 0) {
              const categories = currentTagCat.join(', ');

              systemMsg = 'You are an expert at generating tags for images designed to output JSON. The user will provide you with an image and some categories. You will generate a comma-separated list of' + (enableTagLimit.checked ? ` ${tagLimit.value}` : "") + ' keywords for each category to describe the provided image in order of confidence. Don\'t use any other text. Keep keywords singular, not plural.';
              prompt = `${categories}`;
            } else {
              systemMsg = 'You are an expert at generating tags for images designed to output JSON. The user will provide you with an image. You will generate a comma-separated list of' + (enableTagLimit.checked ? ` ${tagLimit.value}` : "") + ' keywords to describe the provided image in order of confidence. Don\'t use any other text. Keep keywords singular, not plural.';
              prompt = '';
            }

            let msgcontent = [
              { type: "image_url", image_url: { url: url, detail: "low" } },
              { type: "text", text: prompt },
            ];

            const requestBody = {
              model: "gpt-4o",
              temperature: 0.2,
              max_tokens: 500,
              messages: [
                {
                  role: "system",
                  content: systemMsg,
                },
                {
                  role: "user",
                  content: msgcontent,
                }
              ],
              response_format: { type: "json_object" },
            };

            // Log the request body
            console.log('OpenAI API Request:', JSON.stringify(requestBody, null, 2));

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${myAPI}`
              },
              body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            console.log('OpenAI API Response:', data);

            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
              const jsonContent = JSON.parse(data.choices[0].message.content);
              console.log('Parsed JSON content:', jsonContent);

              const allTags = new Set();
              if (tagCatChk.checked) {
                // Handle categorized tags
                for (const category in jsonContent) {
                  if (jsonContent.hasOwnProperty(category)) {
                    const tags = jsonContent[category].split(',').map(tag => tag.trim());
                    tags.forEach(tag => allTags.add(tag));
                  }
                }
              } else {
                // Handle uncategorized tags
                if (typeof jsonContent === 'string') {
                  // If the content is a simple string of comma-separated tags
                  const tags = jsonContent.split(',').map(tag => tag.trim());
                  tags.forEach(tag => allTags.add(tag));
                } else if (Array.isArray(jsonContent)) {
                  // If the content is an array of tags
                  jsonContent.forEach(tag => allTags.add(tag.trim()));
                } else if (typeof jsonContent === 'object') {
                  // If the content is an object
                  for (const key in jsonContent) {
                    if (Array.isArray(jsonContent[key])) {
                      // If the value is an array (like in the example)
                      jsonContent[key].forEach(tag => allTags.add(tag.trim()));
                    } else if (typeof jsonContent[key] === 'string') {
                      // If the value is a string, split it by commas
                      const tags = jsonContent[key].split(',').map(tag => tag.trim());
                      tags.forEach(tag => allTags.add(tag));
                    }
                  }
                } else {
                  console.error('Unexpected JSON format:', jsonContent);
                  throw new Error('Unexpected JSON format in API response');
                }
              }

              responseText = Array.from(allTags).join(', ');
              console.log('Tags returned:', responseText);
            } else {
              console.error('Unexpected API response format:', data);
              throw new Error('Unexpected API response format');
            }

          } else if (apiProvider.value === 'gemini') {
            // Update prompt to include categories as a comma-separated list
            if (tagCatChk.checked && currentTagCat.length > 0) {
              const categories = currentTagCat.join(', ');

              msg01 = 'You are an expert at generating tags for images designed to output JSON. The user will provide you with an image and some categories. You will generate a comma-separated list of' + (enableTagLimit.checked ? ` ${tagLimit.value}` : "") + ' keywords for each category to describe the provided image in order of confidence. Using this JSON schema: {"category": "keyword1, keyword2, keyword3", "category2": "keyword1, keyword2, keyword3"}. Don\'t use any other text. Keep keywords singular, not plural.';
              msg02 = `${categories}`;
            } else {
              msg01 = 'You are an expert at generating tags for images designed to output JSON. The user will provide you with an image. You will generate a comma-separated list of' + (enableTagLimit.checked ? ` ${tagLimit.value}` : "") + ' keywords to describe the provided image in order of confidence. Using this JSON schema: {"keywords": "keyword1, keyword2, keyword3"}. Don\'t use any other text. Keep keywords singular, not plural.';
              msg02 = '';
            }

            const requestBody = {
              contents: [{
                parts: [
                  { text: msg01 },
                  { inline_data: { mime_type: mimeType, data: imagesBase64[i] } },
                  { text: msg02 },
                ],
              }],
              generationConfig: {
                temperature: 1,
                response_mime_type: "application/json",
              }
            };
          
            console.log('Gemini API Request:', JSON.stringify(requestBody, null, 2));
          
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${myAPI}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            });
          
            const data = await response.json();
            console.log('Gemini API Response:', JSON.stringify(data, null, 2));
          
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
              const jsonContent = JSON.parse(data.candidates[0].content.parts[0].text);
              console.log('Parsed JSON content:', jsonContent);

              const allTags = new Set();
              if (tagCatChk.checked) {
                // Handle categorized tags
                for (const category in jsonContent) {
                  if (jsonContent.hasOwnProperty(category)) {
                    const tags = jsonContent[category].split(',').map(tag => tag.trim());
                    tags.forEach(tag => allTags.add(tag));
                  }
                }
              } else {
                // Handle uncategorized tags
                if (typeof jsonContent === 'string') {
                  // If the content is a simple string of comma-separated tags
                  const tags = jsonContent.split(',').map(tag => tag.trim());
                  tags.forEach(tag => allTags.add(tag));
                } else if (Array.isArray(jsonContent)) {
                  // If the content is an array of tags
                  jsonContent.forEach(tag => allTags.add(tag.trim()));
                } else if (typeof jsonContent === 'object') {
                  // If the content is an object
                  for (const key in jsonContent) {
                    if (Array.isArray(jsonContent[key])) {
                      // If the value is an array (like in the example)
                      jsonContent[key].forEach(tag => allTags.add(tag.trim()));
                    } else if (typeof jsonContent[key] === 'string') {
                      // If the value is a string, split it by commas
                      const tags = jsonContent[key].split(',').map(tag => tag.trim());
                      tags.forEach(tag => allTags.add(tag));
                    }
                  }
                } else {
                  console.error('Unexpected JSON format:', jsonContent);
                  throw new Error('Unexpected JSON format in API response');
                }
              }

              responseText = Array.from(allTags).join(', ');
              console.log('Tags returned:', responseText);
            } else {
              console.error('Unexpected API response format:', data);
              throw new Error('Unexpected API response format');
            }
          } else if (apiProvider.value === 'claude') {
            // Update prompt to include categories as a comma-separated list
            let msg01, msg02;
            if (tagCatChk.checked && currentTagCat.length > 0) {
              const categories = currentTagCat.join(', ');
              msg01 = 'You are an expert at generating tags for images designed to output JSON. The user will provide you with an image and some categories. You will generate a comma-separated list of' + (enableTagLimit.checked ? ` ${tagLimit.value}` : "") + ' keywords for each category to describe the provided image in order of confidence. You must respond with this JSON schema: {"category": "keyword1, keyword2, keyword3", "category2": "keyword1, keyword2, keyword3"}. Don\'t use any other text. Keep keywords singular, not plural.';
              msg02 = `${categories}`;
            } else {
              msg01 = 'You are an expert at generating tags for images designed to output JSON. The user will provide you with an image. You will generate a comma-separated list of' + (enableTagLimit.checked ? ` ${tagLimit.value}` : "") + ' keywords to describe the provided image in order of confidence. You must respond with this JSON schema: {"keywords": "keyword1, keyword2, keyword3"}. Don\'t use any other text. Keep keywords singular, not plural.';
              msg02 = '';
            }
            
            const content = [
              { type: "text", text: msg01 },
              { type: "image", source: { type: "base64", media_type: mimeType, data: imagesBase64[i] } }
            ];
            
            if (msg02) {
              content.push({ type: "text", text: msg02 });
            }
            
            const requestBody = {
              model: "claude-3-haiku-20240307",
              max_tokens: 4000,
              messages: [{
                role: "user",
                content: content
              }]
            };

            console.log('Claude API Request:', JSON.stringify(requestBody, null, 2));

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
            console.log('Claude API Response:', JSON.stringify(data, null, 2));
            
            if (data.content && data.content.length > 0 && typeof data.content[0].text === 'string') {
              // Remove leading/trailing whitespace and newlines
              let cleanedJsonString = data.content[0].text.trim();
              
              // Add missing commas between properties if necessary
              cleanedJsonString = cleanedJsonString.replace(/}(\s*){/g, '},\n{');
              cleanedJsonString = cleanedJsonString.replace(/"\s*{/g, '",\n{');
              cleanedJsonString = cleanedJsonString.replace(/}\s*"/g, '},\n"');
              
              try {
                const jsonContent = JSON.parse(cleanedJsonString);
                console.log('Parsed JSON content:', jsonContent);
            
                const allTags = new Set();
                if (tagCatChk.checked) {
                  // Handle categorized tags
                  for (const category in jsonContent) {
                    if (jsonContent.hasOwnProperty(category)) {
                      const tags = jsonContent[category].split(',').map(tag => tag.trim());
                      tags.forEach(tag => allTags.add(tag));
                    }
                  }
                } else {
                  // Handle uncategorized tags
                  if (jsonContent.keywords) {
                    const tags = jsonContent.keywords.split(',').map(tag => tag.trim());
                    tags.forEach(tag => allTags.add(tag));
                  } else {
                    console.error('Unexpected JSON format:', jsonContent);
                    throw new Error('Unexpected JSON format in API response');
                  }
                }
            
                responseText = Array.from(allTags).join(', ');
                console.log('Tags returned:', responseText);
              } catch (error) {
                console.error('Error parsing JSON:', error);
                throw new Error('Failed to parse JSON from API response');
              }
            } else {
              console.error('Unexpected API response format:', data);
              throw new Error('Unexpected API response format');
            }
          }

          // Extract keywords and add as tags
          const tagLimited = enableTagLimit ? tagLimit.value || Infinity : Infinity;
          const tagsToAdd = responseText.split(',').map(tag => tag.trim()).slice(0, tagLimited);

          // Filter out any tags that already exist in the item's tags or replace all tags if the checkbox is checked
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
          progressBar.style.width = `${progressPercentage}%`;

          // Append the processed item to the log
          processedItemsLog.push(`<b>Last tagged '${item.name}.${item.ext}'</b>: <br> ${newTags.join(', ')}`);
          pLogText.innerHTML = processedItemsLog.join('<br><br>');

        } catch (error) {
          console.error('Error:', error);
          statusElement.textContent = 'An error occurred.';
        }
      }
      // Reset the isCancelled flag after the loop
      isCancelled = false;
      // Disable the sheen after all files have been processed
      progressDone();
    } catch (error) {
      console.error('Error:', error);
      checkStatus(5000); // Clear after 5 seconds
    }
  });
});