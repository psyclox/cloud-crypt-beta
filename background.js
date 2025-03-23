const CLIENT_ID = "205530538210-97ub4gendejoa15h4p5iai65t6kpckea.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "authenticateGoogleDrive") {
        authenticateGoogleDrive().then(sendResponse);
        return true; // Required for async response
    }
});

// ✅ Authenticate Google Drive Using OAuth2
async function authenticateGoogleDrive() {
    return new Promise((resolve, reject) => {
        const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&prompt=consent`;

        chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectUrl) => {
            if (chrome.runtime.lastError || !redirectUrl) {
                console.error("❌ Google authentication failed:", chrome.runtime.lastError);
                resolve(null);
                return;
            }

            // ✅ Extract Access Token from URL
            const params = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
            const token = params.get("access_token");

            if (!token) {
                console.error("❌ No token found in authentication response.");
                resolve(null);
                return;
            }

            console.log("✅ Google authentication successful");
            resolve(token);
        });
    });
}
