const CLIENT_ID = "205530538210-97ub4gendejoa15h4p5iai65t6kpckea.apps.googleusercontent.com";
const API_KEY = "YOUR_GOOGLE_API_KEY";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let gapiLoaded = false;

// ✅ Load Google API Client Once
async function loadGapi() {
    return new Promise((resolve) => {
        if (gapiLoaded) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => {
            gapi.load("client:auth2", async () => {
                await gapi.client.init({ apiKey: API_KEY, clientId: CLIENT_ID, scope: SCOPES });
                gapiLoaded = true;
                resolve();
            });
        };
        document.body.appendChild(script);
    });
}

// ✅ Authenticate & Get Google Drive Token
async function authenticateGoogleDrive() {
    await loadGapi();
    
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance) {
        console.error("⚠️ Google Auth instance not initialized.");
        updateStatus("⚠️ Google authentication failed.", "error");
        return null;
    }

    if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
    }

    const user = authInstance.currentUser.get();
    const token = user.getAuthResponse().access_token;
    
    // ✅ Store token in localStorage for future uploads
    localStorage.setItem("gdrive_token", token);

    return token;
}

// ✅ Upload File to Google Drive
async function uploadToGoogleDrive(fileBlob, fileName) {
    let token = localStorage.getItem("gdrive_token");

    // If no stored token, re-authenticate
    if (!token) {
        token = await authenticateGoogleDrive();
        if (!token) return false;
    }

    const metadata = { name: fileName, mimeType: fileBlob.type };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", fileBlob);

    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
    });

    return response.ok;
}

// ✅ Upload Button Event Listener (Fixed)
document.getElementById("uploadBtn").addEventListener("click", async function () {
    if (selectedFiles.length === 0) {
        updateStatus("⚠️ No files selected for upload.", "error");
        return;
    }

    updateStatus("🔍 Authenticating Google Drive...", "info");

    for (const file of selectedFiles) {
        try {
            // ✅ Encrypt before upload
            const encryptedBlob = await encryptFile(file, document.getElementById("passwordInput").value);

            updateStatus(`⬆️ Uploading ${file.name}...`, "info");

            const success = await uploadToGoogleDrive(encryptedBlob, `${file.name}.encrypted`);
            if (success) {
                updateStatus(`✅ ${file.name} uploaded successfully!`, "success");
            } else {
                updateStatus(`❌ Failed to upload ${file.name}.`, "error");
            }
        } catch (error) {
            updateStatus(`❌ Upload error: ${error.message}`, "error");
        }
    }
});
