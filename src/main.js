const API_URL = 'https://api.imgflip.com';
const TIMEOUT = 5000;
const USERNAME = 'koe-kto-s';
const PASSWORD = 'rain_mem';


const mainPage = document.getElementById('main-page');
const generatorPage = document.getElementById('generator-page');
const memesGrid = document.getElementById('memes-grid');
const loadingElement = document.getElementById('loading');
const noResultsElement = document.getElementById('no-results');
const timeoutMessage = document.getElementById('timeout-message');


const selectedMemeImage = document.getElementById('selected-meme-image');
const selectedMemeName = document.getElementById('selected-meme-name');
const textInputsContainer = document.getElementById('text-inputs-container');
const generateButton = document.getElementById('generate-button');
const generateError = document.getElementById('generate-error');
const resultSection = document.getElementById('result-section');
const generatedMemeImage = document.getElementById('generated-meme-image');
const downloadButton = document.getElementById('download-button');

let selectedMeme = null;
let abortController = null;


fetchPopularMemes();


document.getElementById('search-button').addEventListener('click', function () {
  const query = document.getElementById('search-input').value.trim();
  fetchPopularMemes(query);
});


document.querySelector('.home-button').addEventListener('click', function (e) {
  e.preventDefault();
  showMainPage();
});


generateButton.addEventListener('click', generateMeme);


function showMainPage() {
  generatorPage.style.display = 'none';
  mainPage.style.display = 'block';
  fetchPopularMemes();
}


async function fetchPopularMemes(query = null) {
  if (abortController) {
    abortController.abort();
  }

  loadingElement.style.display = 'block';
  noResultsElement.style.display = 'none';
  timeoutMessage.style.display = 'none';
  memesGrid.style.display = 'none';

  abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
    showTimeoutMessage();
  }, TIMEOUT);

  try {
    const response = await fetch(`${API_URL}/get_memes`, {
      signal: abortController.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.success) {
      let memes = data.data.memes;

      if (query) {
        memes = memes.filter(meme =>
          meme.name.toLowerCase().includes(query.toLowerCase())
        );
      }

      if (memes.length > 0) {
        displayMemes(memes);
      } else {
        showNoResults();
      }
    } else {
      showError(data.error_message);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      showTimeoutMessage();
    } else {
      showError(error.message);
    }
  } finally {
    loadingElement.style.display = 'none';
  }
}

function showTimeoutMessage() {
  timeoutMessage.style.display = 'block';
  memesGrid.style.display = 'none';
  noResultsElement.style.display = 'none';
}

function showNoResults() {
  noResultsElement.style.display = 'block';
  memesGrid.style.display = 'none';
}

function showError(message) {
  noResultsElement.textContent = `Ошибка: ${message}`;
  noResultsElement.style.display = 'block';
  memesGrid.style.display = 'none';
}

function displayMemes(memes) {
  memesGrid.innerHTML = '';

  memes.forEach(meme => {
    const memeCard = document.createElement('div');
    memeCard.className = 'meme-card';
    memeCard.dataset.id = meme.id;
    memeCard.dataset.boxCount = meme.box_count;

    memeCard.innerHTML = `
        <img src="${meme.url}" alt="${meme.name}">
        <h3>${meme.name}</h3>
      `;

    memeCard.addEventListener('click', () => {
      selectMeme(meme);
    });

    memesGrid.appendChild(memeCard);
  });

  memesGrid.style.display = 'grid';
}

function selectMeme(meme) {
  selectedMeme = meme;
  selectedMemeImage.src = meme.url;
  selectedMemeName.textContent = meme.name;

  createTextInputs(meme.box_count);

  generatedMemeImage.style.display = 'none';
  downloadButton.style.display = 'none';
  generateError.textContent = '';

  mainPage.style.display = 'none';
  generatorPage.style.display = 'block';
}

function createTextInputs(count) {
  textInputsContainer.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'text-input-group';

    const label = document.createElement('label');
    label.textContent = `Текст ${i + 1}:`;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Текст для блока ${i + 1}`;
    input.dataset.index = i;

    inputGroup.appendChild(label);
    inputGroup.appendChild(input);
    textInputsContainer.appendChild(inputGroup);
  }
}

async function generateMeme() {
  if (!selectedMeme) return;

  generateError.textContent = '';
  const textInputs = textInputsContainer.querySelectorAll('input');
  const textParams = {};

  textInputs.forEach((input, index) => {
    textParams[`boxes[${index}][text]`] = input.value;
  });

  try {
    const formData = new URLSearchParams();
    formData.append('template_id', selectedMeme.id);
    formData.append('username', USERNAME);
    formData.append('password', PASSWORD);
    formData.append('font', document.getElementById('font-select').value);

    for (const [key, value] of Object.entries(textParams)) {
      formData.append(key, value);
    }
    const response = await fetch(`${API_URL}/caption_image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      generatedMemeImage.src = data.data.url;
      generatedMemeImage.style.display = 'block';
      downloadButton.style.display = 'inline-block';

      downloadButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = data.data.url;
        link.download = 'my-meme.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } else {
      generateError.textContent = data.error_message || 'Ошибка при генерации мема';
    }
  } catch (error) {
    generateError.textContent = 'Ошибка сети: ' + error.message;
  }
}
