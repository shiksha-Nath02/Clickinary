/* global chrome */

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "clickinary",
        title: "Get Meaning",
        contexts: ['selection']
    });
});

// Safe sendMessage function
function safeSendMessage(tabId, message) {
    chrome.tabs.sendMessage(tabId, message, function(response) {
        if (chrome.runtime.lastError) {
            console.log("No content script on this tab:", chrome.runtime.lastError.message);
        }
    });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((clickData, tab) => {
    if (clickData.menuItemId === "clickinary") {
        const word = clickData.selectionText;
        const url = "https://api.dictionaryapi.dev/api/v2/entries/en/" + word;
        let meaning = "! Meaning not found !!";

        fetch(url)
            .then(response => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(`Response status was not 200, it was ${response.status}`);
                }
            })
            .then(data => {
                // Get the first definition
                meaning = data[0]?.meanings?.[0]?.definitions?.[0]?.definition || meaning;

                chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                    if (tabs[0] && !tabs[0].url.startsWith("chrome://")) {
                        safeSendMessage(tabs[0].id, { type: "word-meaning", meaning: meaning });
                    }
                });
            })
            .catch(error => {
                console.log("Error fetching meaning:", error);

                chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                    if (tabs[0] && !tabs[0].url.startsWith("chrome://")) {
                        safeSendMessage(tabs[0].id, { type: "word-meaning", meaning: meaning });
                    }
                });
            });
    }
});
