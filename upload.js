document.getElementById("uploadBtn").addEventListener("click", async function () {
    if (selectedFiles.length === 0) {
        updateStatus("⚠️ No files selected for upload.", "error");
        return;
    }

    updateStatus("🔍 Authenticating Google Drive...", "info");

    // 🔹 Request authentication from background.js
    chrome.runtime.sendMessage({ action: "authenticateGoogleDrive" }, async (response) => {
        if (!response || !response.token) {  // ✅ Fix: Check response object properly
            updateStatus("❌ Google authentication failed.", "error");
            return;
        }

        updateStatus("🔒 Encrypting files before upload...", "info");

        for (let file of selectedFiles) {
            try {
                const password = document.getElementById("passwordInput").value;
                if (!password) {
                    updateStatus("⚠️ Password is required for encryption!", "error");
                    return;
                }

                const encryptedBlob = await encryptFile(file, password);
                updateStatus(`⬆️ Uploading ${file.name}...`, "info");

                const success = await uploadToGoogleDrive(encryptedBlob, `${file.name}.encrypted`, response.token); // ✅ Corrected token retrieval
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
});
