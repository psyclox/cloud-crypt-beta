chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkPlatformLogin") {
        sendResponse(checkPlatformLogin(request.platform));
    }
});

function checkPlatformLogin(platform) {
    return !!document.querySelector('div[aria-label="Google Account"]');
}
