// 🔐 Encrypt Files
document.getElementById("encryptBtn").addEventListener("click", async function () {
    if (!selectedFiles.length) {
        updateStatus("⚠️ No files selected for encryption!", "error");
        return;
    }

    const password = document.getElementById("passwordInput").value;
    if (!password) {
        updateStatus("⚠️ Password is required for encryption!", "error");
        return;
    }

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
            updateStatus(`🔒 Encrypting ${file.name}... (${i + 1}/${selectedFiles.length})`, "info", 0);

            // Create progress callback
            const onProgress = (progress) => {
                updateStatus(`🔒 Encrypting ${file.name}... (${i + 1}/${selectedFiles.length})`, "info", progress);
            };

            const encryptedBlob = await encryptFile(file, password, onProgress);

            try {
                await downloadFile(encryptedBlob, file.name + ".crypted");
                updateStatus(`✅ ${file.name} encrypted and saved!`, "success");
            } catch (downloadError) {
                console.error("Download failed:", downloadError);
                updateStatus(`❌ Failed to save ${file.name}: ${downloadError.message}`, "error");
            }
        } catch (error) {
            updateStatus(`❌ Error encrypting ${file.name}: ${error.message}`, "error");
        }
    }

    setTimeout(clearFields, 1000);
});

// 🔓 Decrypt Files
document.getElementById("decryptBtn").addEventListener("click", async function () {
    if (!selectedFiles.length) {
        updateStatus("⚠️ No files selected for decryption!", "error");
        return;
    }

    const password = document.getElementById("passwordInput").value;
    if (!password) {
        updateStatus("⚠️ Password is required for decryption!", "error");
        return;
    }

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
            if (!file.name.endsWith('.crypted')) {
                updateStatus(`❌ ${file.name} is not a .crypted file!`, "error");
                continue;
            }

            updateStatus(`🔓 Decrypting ${file.name}... (${i + 1}/${selectedFiles.length})`, "info", 0);

            // Create progress callback
            const onProgress = (progress) => {
                updateStatus(`🔓 Decrypting ${file.name}... (${i + 1}/${selectedFiles.length})`, "info", progress);
            };

            const fileData = await file.arrayBuffer();
            const encryptedBlob = new Blob([fileData], { type: "application/octet-stream" });
            const decryptedBlob = await decryptFile(encryptedBlob, password, onProgress);

            const originalName = file.name.replace('.crypted', '');
            downloadFile(decryptedBlob, originalName);

            updateStatus(`✅ ${file.name} decrypted successfully!`, "success");
        } catch (error) {
            updateStatus(`❌ Error decrypting ${file.name}: ${error.message}`, "error");
            console.error("Decryption error details:", error);
        }
    }
});

// ✅ Utility: Download files
function downloadFile(blob, fileName) {
    return new Promise((resolve, reject) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.style.display = "none";

        // Add event listeners to track success/failure
        a.addEventListener("click", () => {
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                resolve();
            }, 100);
        });

        // Handle download errors
        window.addEventListener('focus', function trackDownload() {
            setTimeout(() => {
                const blobStillExists = a.href.startsWith('blob:');
                if (blobStillExists) {
                    window.URL.revokeObjectURL(url);
                    reject(new Error('Download was cancelled or failed'));
                }
                window.removeEventListener('focus', trackDownload);
            }, 2000);
        });

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// ✅ Clear Fields
function clearFields() {
    // Clear only the files array and password field
    selectedFiles.length = 0;
    document.getElementById("passwordInput").value = "";
    
    // Instead of clearing the entire fileList, just update the displayed items
    const fileList = document.getElementById("fileList");
    fileList.innerHTML = selectedFiles.map(file => 
        `<li>${truncateFileName(file.name)}</li>`
    ).join('');
}

// Add this helper function for filename truncation
function truncateFileName(name, maxLength = 30) {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength / 2)}...${name.substring(name.length - maxLength / 2)}`;
}
