const CLIENT_ID = "205530538210-0qr8mq95ird0u7jh8dkac3l6g651m1se.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

// ✅ Fix: Use Chrome Extension's internal redirect URI
const REDIRECT_URI = chrome.identity.getRedirectURL();

// 🚀 Google Authentication Flow
async function authenticateGoogleDrive() {
    return new Promise(resolve => {
        const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&access_type=online&prompt=consent`;

        chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, redirectUrl => {
            if (chrome.runtime.lastError || !redirectUrl) {
                console.error("❌ Google authentication failed:", chrome.runtime.lastError);
                resolve(null);
                return;
            }

            try {
                const urlParams = new URL(redirectUrl.split("#")[1]);
                const accessToken = urlParams.get("access_token");

                if (accessToken) {
                    console.log("✅ Successfully authenticated. Token received.");
                    chrome.storage.local.set({ gdrive_token: accessToken });
                    resolve(accessToken);
                } else {
                    console.error("❌ No access token found.");
                    resolve(null);
                }
            } catch (err) {
                console.error("❌ Error extracting access token:", err);
                resolve(null);
            }
        });
    });
}

// 🔄 Listen for authentication request
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "authenticateGoogleDrive") {
        authenticateGoogleDrive().then(token => {
            sendResponse({ token });
        }).catch(error => {
            console.error("❌ Authentication error:", error);
            sendResponse(null);
        });
        return true; // Keeps connection open for async response
    }
});
