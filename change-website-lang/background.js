// Dictionaries for locale mapping
const localeMapping = {
  '/en-us/': '/ja-jp/',
  '/ja-jp/': '/en-us/',
  '/en/': '/ja/',
  '/ja/': '/en/',
};

async function changeCurrentTab(offset) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0].url;

  for (const [locale, replacement] of Object.entries(localeMapping)) {
    if (url.includes(locale)) {
      const nextUrl = url.replace(locale, replacement);

      // Update URL and scroll page after URL changes
      chrome.tabs.update(tabs[0].id, { url: nextUrl }, () => {
        // Add event listener for tab update only when we have an offset
        if (offset !== 0) {
          chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (tabId === tabs[0].id && changeInfo.status === 'complete') {
              chrome.scripting.executeScript({
                target: { tabId },
                func: scrollPage,
                args: [offset],
              });
            }
          });
        }
      });

      return;
    }
  }
}

function getOffset() {
  return window.pageYOffset;
}

function scrollPage(offset) {
  window.scrollTo({ left: 0, top: offset });
}

const extensionIconClickListener = (tab) => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: getOffset,
    },
    (injectionResults) => {
      const offset = injectionResults[0].result;

      changeCurrentTab(offset);
    },
  );
};

chrome.action.onClicked.addListener(extensionIconClickListener);
