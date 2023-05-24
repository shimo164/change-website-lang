const LOCALE_MAPPING = {
  '/en-us/': '/ja-jp/',
  '/ja-jp/': '/en-us/',
  '/en/': '/ja/',
  '/ja/': '/en/',
};

const ALLOWED_URLS = ['https://learn.microsoft.com', 'https://docs.github.com'];

function getReplacementUrl(url) {
  for (const [locale, replacement] of Object.entries(LOCALE_MAPPING)) {
    if (url.includes(locale)) {
      return url.replace(locale, replacement);
    }
  }

  return null;
}

function hasPermission(url, callback) {
  chrome.permissions.contains(
    {
      origins: [new URL(url).origin + '/*'],
    },
    callback,
  );
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

  if (replacementUrl) {
    hasPermission(replacementUrl, (hasPermissions) => {
      if (hasPermissions) {
        setScrollOffset(tabs[0].id, offset);
        chrome.tabs.update(tabs[0].id, { url: replacementUrl });
      }
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    ALLOWED_URLS.some((allowedUrl) => tab.url.includes(allowedUrl))
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
