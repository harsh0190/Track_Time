let activeTabId = null;
let activeDomain = null;
let startTime = null;
let currentDate = new Date().toLocaleDateString();
const whitelist = [];
const blacklist = ["youtube.com", "facebook.com"];

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isTrackable(domain) {
  if (whitelist.length > 0) return whitelist.includes(domain);
  return !blacklist.includes(domain);
}

function updateTime(domain, timeSpent) {
  if (!isTrackable(domain)) return;
  const key = `${domain}__${currentDate}`;
  chrome.storage.local.get([key], (result) => {
    const totalTime = (result[key] || 0) + timeSpent;
    chrome.storage.local.set({ [key]: totalTime });
  });
}

function stopTimer() {
  if (activeDomain && startTime) {
    const timeSpent = Date.now() - startTime;
    updateTime(activeDomain, timeSpent);
  }
  startTime = null;
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (!tab.url) return;
    stopTimer();
    activeTabId = tabId;
    activeDomain = getDomain(tab.url);
    startTime = Date.now();
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    stopTimer();
    activeDomain = getDomain(changeInfo.url);
    startTime = Date.now();
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTimer();
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      activeDomain = getDomain(tabs[0].url);
      startTime = Date.now();
    });
  }
});

chrome.idle.onStateChanged.addListener((newState) => {
  if (newState === "idle" || newState === "locked") {
    stopTimer();
  } else if (newState === "active") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      activeDomain = getDomain(tabs[0].url);
      startTime = Date.now();
    });
  }
});