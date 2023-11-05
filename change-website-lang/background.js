let TARGET_INFO = [];

// Function to update TARGET_INFO from chrome.storage
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

// Call updateTargetInfo to initially populate TARGET_INFO
updateTargetInfo();

function toggleAwsDocLocale(url, langCode) {
  const langPath = `/${langCode}/`;
  if (url.includes(langPath)) {
    return url.replace(langPath, '/');
  } else {
    // If no language path in URL, switch from English to the specified language
    const pathMatch = url.match(
      new RegExp(`https://docs\\.aws\\.amazon\\.com/(.*?)/(.*)`),
    );
    if (pathMatch) {
      return `https://docs.aws.amazon.com/${langCode}/${pathMatch[1]}/${pathMatch[2]}`;
    }
  }
  return url;
}

function getReplacementUrl(url) {
  for (const target of TARGET_INFO) {
    if (url.includes(target.locales[0])) {
      return url.replace(target.locales[0], target.locales[1]);
    }
    if (url.includes(target.locales[1])) {
      return url.replace(target.locales[1], target.locales[0]);
    }
  }
  const langCode = 'ja_jp';

  if (url.startsWith('https://docs.aws.amazon.com')) {
    return toggleAwsDocLocale(url, langCode);
  }

  return null;
}

// This function checks if the URL is one of the targets
function isInTarget(url) {
  return url && TARGET_INFO.some((target) => url.startsWith(target.url));
}

// This function sets the scroll offset in localStorage
function setScrollOffset(tabId, offset) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (offset) => {
      localStorage.setItem('scrollOffset', offset);
      localStorage.setItem('programmaticURLChange', 'true');
    },
    args: [offset],
  });
}

// This function changes the current tab's URL
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

// Event listener for when a tab is updated
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
        const programmaticURLChange = localStorage.getItem(
          'programmaticURLChange',
        );

        if (programmaticURLChange) {
          window.scrollTo({
            left: 0,
            top: localStorage.getItem('scrollOffset'),
          });

          localStorage.removeItem('programmaticURLChange');
          localStorage.removeItem('scrollOffset');
        } else {
          window.scrollTo(0, 0);
        }
      },
    });
  }
});

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === 'updateTargetInfo') {
    updateTargetInfo();
  }
});
