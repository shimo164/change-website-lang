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

function getReplacementUrl(url) {
  for (const target of TARGET_INFO) {
    if (url.includes(target.locales[0])) {
      return url.replace(target.locales[0], target.locales[1]);
    }
    if (url.includes(target.locales[1])) {
      return url.replace(target.locales[1], target.locales[0]);
    }
  }
  return null;
}

function isInTarget(url) {
  return url && TARGET_INFO.some((target) => url.startsWith(target.url));
}

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
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
