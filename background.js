chrome.runtime.onInstalled.addListener(() => {
    console.log("✅ Cloud Crypt extension installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "detectCloudPlatforms") {
        detectLoggedInCloudPlatforms().then(sendResponse);
        return true; // Required for async response
    }
});

// 🌐 Detect Logged-in Cloud Platforms
async function detectLoggedInCloudPlatforms() {
    const platforms = ["Google Drive", "OneDrive", "MediaFire"];
    const loggedInPlatforms = [];

    for (const platform of platforms) {
        try {
            const isLoggedIn = await checkPlatformLogin(platform);
            if (isLoggedIn) loggedInPlatforms.push(platform);
        } catch (error) {
            console.error(`❌ Error detecting ${platform}:`, error);
        }
    }

    return loggedInPlatforms;
}

// 🔍 Check If Platform is Logged In
async function checkPlatformLogin(platform) {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: (platform) => {
                    const platformSelectors = {
                        "Google Drive": 'div[aria-label="Google Account"]',
                        "OneDrive": 'button[aria-label="Settings"]',
                        "MediaFire": 'div[id="user-avatar"]'
                    };
                    return !!document.querySelector(platformSelectors[platform]);
                },
                args: [platform],
            }, (results) => {
                resolve(results[0]?.result || false);
            });
        });
    });
};
