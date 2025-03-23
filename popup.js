// 🔥 Update Status Messages
function updateStatus(message, type) {
    const status = document.getElementById("status");
    status.textContent = message;
    console.log(`[STATUS] ${message}`);

    const styles = {
        success: { color: "#155724", backgroundColor: "#D4EDDA" },
        error: { color: "#721C24", backgroundColor: "#F8D7DA" },
        info: { color: "#004085", backgroundColor: "#CCE5FF" }
    };

    Object.assign(status.style, {
        color: styles[type]?.color || "#004085",
        backgroundColor: styles[type]?.backgroundColor || "#CCE5FF",
        padding: "10px",
        borderRadius: "5px",
        marginTop: "10px",
        textAlign: "center",
        opacity: "1"
    });

    setTimeout(() => { status.style.opacity = "0"; }, 5000);
}

// 📤 Upload to Google Drive
document.getElementById("uploadBtn").addEventListener("click", async function () {
    if (!selectedFiles.length) {
        updateStatus("⚠️ No files selected for upload.", "error");
        return;
    }

    const password = document.getElementById("passwordInput").value;
    if (!password) {
        updateStatus("⚠️ Password is required for encryption!", "error");
        return;
    }

    updateStatus("🔍 Authenticating Google Drive...", "info");

    try {
        const token = localStorage.getItem("gdrive_token");
        if (!token) {
            updateStatus("⚠️ Please add a Google Drive account first.", "error");
            return;
        }

        updateStatus("🔒 Encrypting files...", "info");

        for (let file of selectedFiles) {
            try {
                const encryptedBlob = await encryptFile(file, password);
                updateStatus(`⬆️ Uploading ${file.name}...`, "info");

                const uploadSuccess = await uploadFileToDrive(encryptedBlob, `${file.name}.encrypted`, token);
                uploadSuccess
                    ? updateStatus(`✅ ${file.name} uploaded successfully!`, "success")
                    : updateStatus(`❌ Failed to upload ${file.name}.`, "error");
            } catch (error) {
                updateStatus(`❌ Upload error: ${error.message}`, "error");
            }
        }

        setTimeout(clearFields, 1000);
    } catch (error) {
        updateStatus(`❌ Upload error: ${error.message}`, "error");
    }
});

