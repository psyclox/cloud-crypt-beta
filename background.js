const CLIENT_ID = "205530538210-0qr8mq95ird0u7jh8dkac3l6g651m1se.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const REDIRECT_URI = "https://cl0udcrypt.web.app/auth.html"; // ✅ Correct Firebase Redirect URI

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "authenticateGoogleDrive") {
        authenticateGoogleDrive().then(token => {
            if (token) {
                chrome.storage.local.set({ gdrive_token: token });
                sendResponse({ token });
            } else {
                sendResponse(null);
            }
        }).catch(error => {
            console.error("❌ Authentication failed:", error);
            sendResponse(null);
        });
        return true; // Keeps connection open for async response
    }
});

// 🔥 Optimized Google Drive Authentication (Fixed!)
async function authenticateGoogleDrive() {
    return new Promise(resolve => {
        const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;

        chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, redirectUrl => {
            if (chrome.runtime.lastError || !redirectUrl) {
                console.error("❌ Google authentication failed:", chrome.runtime.lastError);
                resolve(null);
                return;
            }

            try {
                const urlParams = new URL(redirectUrl).searchParams;
                const authCode = urlParams.get("code");
                if (authCode) {
                    console.log("✅ Successfully authenticated. Exchanging code for token...");
                    exchangeAuthCodeForToken(authCode).then(token => resolve(token)).catch(err => {
                        console.error("❌ Token exchange failed:", err);
                        resolve(null);
                    });
                } else {
                    resolve(null);
                }
            } catch (err) {
                console.error("❌ Error extracting auth code:", err);
                resolve(null);
            }
        });
    });
}

// 🔄 Exchange Auth Code for Access Token
async function exchangeAuthCodeForToken(authCode) {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const body = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: "YOUR_CLIENT_SECRET", // ⚠️ Store this securely (e.g., Firebase Functions)
        code: authCode,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI
    });

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
    });

    const data = await response.json();
    return data.access_token || null;
}
