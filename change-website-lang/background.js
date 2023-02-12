function getOffset() {
  return window.pageYOffset;
}

function scrollPage(offset) {
  window.scrollTo({ left: 0, top: offset });
}

async function changeCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0].url;
  const locale1 = '/en-us/';
  const locale2 = '/ja-jp/';
  const locale3 = '/en/';
  const locale4 = '/ja/';

  let nextUrl = '';
  if (url.search(locale1) !== -1) {
    nextUrl = url.replace(locale1, locale2);
  } else if (url.search(locale2) !== -1) {
    nextUrl = url.replace(locale2, locale1);
  } else if (url.search(locale3) !== -1) {
    nextUrl = url.replace(locale3, locale4);
  } else if (url.search(locale4) !== -1) {
    nextUrl = url.replace(locale4, locale3);
  } else {
    // No locale match, do nothing.
    return;
  }
  chrome.tabs.update({ url: nextUrl });
}

function scrollPageAfterUrlChange(offset) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (offset === 0) {
      return;
    }
    if (changeInfo.status === 'complete') {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrollPage,
        args: [offset],
      });
      offset = 0;
    }
  });
}

const extensionIconClickListener = (tab) => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: getOffset,
    },
    (injectionResults) => {
      const offset = injectionResults[0].result;

      changeCurrentTab();
      scrollPageAfterUrlChange(offset);
    },
  );
};

chrome.action.onClicked.addListener(extensionIconClickListener);
