document.getElementById("uploadBtn").addEventListener("click", async function () {
    if (selectedFiles.length === 0) {
        updateStatus("⚠️ No files selected for upload.", "error");
        return;
    }

    const password = document.getElementById("passwordInput").value;
    if (!password) {
        updateStatus("⚠️ Password is required for encryption!", "error");
        return;
    }

    updateStatus("🔍 Authenticating Google Drive...", "info");

    chrome.runtime.sendMessage({ action: "authenticateGoogleDrive" }, async (response) => {
        if (!response || !response.token) {
            updateStatus("❌ Google authentication failed.", "error");
            return;
        }

        try {
            updateStatus("🔒 Encrypting files before upload...", "info");

            // Encrypt all files first to optimize speed
            const encryptedFiles = await Promise.all(
                selectedFiles.map(file => encryptFile(file, password))
            );

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const encryptedBlob = encryptedFiles[i];

                updateStatus(`⬆️ Uploading ${file.name}...`, "info");

                const success = await uploadToGoogleDrive(encryptedBlob, `${file.name}.encrypted`, response.token);
                if (success) {
                    updateStatus(`✅ ${file.name} uploaded successfully!`, "success");
                } else {
                    updateStatus(`❌ Failed to upload ${file.name}.`, "error");
                }
            }
        } catch (error) {
            console.error("❌ Encryption or upload process failed:", error);
            updateStatus(`❌ Process error: ${error.message}`, "error");
        }
    });
});

async function uploadToGoogleDrive(fileBlob, fileName, token) {
    const metadata = { 
        name: fileName, 
        mimeType: fileBlob.type || "application/octet-stream" 
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", fileBlob);

    try {
        const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Upload failed:", errorData);
            updateStatus(`❌ Upload failed: ${errorData.error.message}`, "error");
            return false;
        }

        return true;
    } catch (error) {
        console.error("❌ Network error during upload:", error);
        updateStatus("❌ Network error. Check your internet connection.", "error");
        return false;
    }
}
