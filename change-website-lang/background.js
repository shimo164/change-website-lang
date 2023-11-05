let TARGET_INFO = [];

// Fetch and parse TARGET_INFO from chrome.storage
function updateTargetInfo() {
  chrome.storage.local.get(['target_info'], function (result) {
    if (result.target_info) {
      TARGET_INFO = result.target_info.split('\n').map((line) => {
        const [url, ...locales] = line.split(',').map((str) => str.trim());
        return { url, locales };
      });
    }
  });
}

// Initialize TARGET_INFO when the extension starts
updateTargetInfo();

// Switches AWS documentation locale, preserving or removing language path
function toggleAwsDocLocale(url, langCode) {
  const langPath = `/${langCode}/`;
  if (url.includes(langPath)) {
    // If language path is already present, remove it to switch to English
    return url.replace(langPath, '/');
  } else {
    // If not present, add the language path to switch from English
    const pathMatch = url.match(
      new RegExp(`https://docs\\.aws\\.amazon\\.com/(.*?)/(.*)`),
    );
    if (pathMatch) {
      return `https://docs.aws.amazon.com/${langCode}/${pathMatch[1]}/${pathMatch[2]}`;
    }
  }
  return url;
}

// Generate a URL with the desired locale swapped
function getReplacementUrl(url) {
  let newUrl = null;
  for (const target of TARGET_INFO) {
    if (url.includes(target.locales[0])) {
      newUrl = url.replace(target.locales[0], target.locales[1]);
      break;
    }
    if (url.includes(target.locales[1])) {
      newUrl = url.replace(target.locales[1], target.locales[0]);
      break;
    }
  }

  if (!newUrl && url.startsWith('https://docs.aws.amazon.com')) {
    const langCode = 'ja_jp';
    newUrl = toggleAwsDocLocale(url, langCode);
  }

  // Return the new URL without the hash fragment
  return newUrl;
}

// Check if the URL belongs to one of the targets defined in TARGET_INFO
function isInTarget(url) {
  return url && TARGET_INFO.some((target) => url.startsWith(target.url));
}

// Save the current scroll position before changing the tab's URL
function setScrollOffset(tabId, offset) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (offset) => {
      localStorage.setItem('scrollOffset', offset);
      localStorage.setItem('urlChangeInitiatedByExtension', 'true');
    },
    args: [offset],
  });
}

// Change the URL of the current tab and store the scroll offset
async function changeCurrentTab(offset) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) {
    return;
  }

  const replacementUrl = getReplacementUrl(tabs[0].url);
  const isInTargets = isInTarget(replacementUrl);

  if (isInTargets && replacementUrl) {
    setScrollOffset(tabs[0].id, offset);
    chrome.tabs.update(tabs[0].id, { url: replacementUrl });
  }
}

// Listener for tab updates to handle scroll position after extension-initiated navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    !tab.url.startsWith('chrome://') &&
    TARGET_INFO.some((target) => tab.url.includes(target.url))
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const urlChangeInitiatedByExtension = localStorage.getItem(
          'urlChangeInitiatedByExtension',
        );

        if (urlChangeInitiatedByExtension) {
          const savedOffset = localStorage.getItem('scrollOffset');
          window.scrollTo({
            left: 0,
            top: savedOffset ? parseInt(savedOffset, 10) : 0,
          });

          localStorage.removeItem('urlChangeInitiatedByExtension');
          localStorage.removeItem('scrollOffset');
        }
      },
    });
  }
});

// Handle the extension's icon click event to save scroll position and navigate
const extensionIconClickListener = (tab) => {
  chrome.scripting
    .executeScript({
      target: { tabId: tab.id },
      func: () => window.pageYOffset,
    })
    .then((injectionResults) => {
      changeCurrentTab(injectionResults[0].result);
    })
    .catch((error) => {
      console.log('Error executing script: ', error);
    });
};

chrome.action.onClicked.addListener(extensionIconClickListener);
// Listen for messages from other parts of the extension to update target info
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === 'updateTargetInfo') {
    updateTargetInfo();
  }
});
