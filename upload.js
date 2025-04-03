// Import the encryptFile function from crypto.js
// Ensure crypto.js is properly included in your project
// If using ES modules, you can import it like this:
// import { encryptFile } from './crypto.js';

// Status manager
const StatusManager = {
    show(message, type = 'info') {
        const status = document.getElementById('status');
        if (!status) return;

        status.textContent = message;
        status.className = `status-${type}`;
        console.log(`[STATUS] ${message}`);

        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            status.textContent = '';
            status.className = '';
        }, 5000);
    }
};

// Modified upload function for small files (<15MB)
async function uploadFileToDrive(arrayBuffer, fileName, token, onProgress) {
    try {
        const fileBlob = new Blob([arrayBuffer], { type: "application/octet-stream" });
        const metadata = {
            name: fileName,
            mimeType: "application/octet-stream"
        };

        const formData = new FormData();
        formData.append("metadata", new Blob([JSON.stringify(metadata)], { 
            type: "application/json" 
        }));
        formData.append("file", fileBlob);

        if (onProgress) {
            // Simulate progress for small files
            for (let i = 0; i <= 100; i += 10) {
                setTimeout(() => onProgress(i), i * 20);
            }
        }

        const response = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", 
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Drive API error:", errorData);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Upload failed:", error);
        return false;
    }
}

// Handle file uploads with encryption
document.getElementById("uploadBtn").addEventListener("click", async function () {
    if (selectedFiles.length === 0) {
        updateStatus("⚠️ No files selected", "error");
        return;
    }

    const password = document.getElementById("passwordInput").value;
    if (!password) {
        updateStatus("⚠️ Password required", "error");
        return;
    }

    updateStatus("🔍 Authenticating...", "info");

    try {
        const { token } = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: "authenticateGoogleDrive" },
                (response) => response?.token ? resolve(response) : reject(new Error("Authentication failed"))
            );
        });

        for (const file of selectedFiles) {
            try {
                updateStatus(`🔒 Encrypting ${file.name}...`, "info", 0);
                const encryptedBlob = await encryptFile(file, password, (progress) => {
                    updateStatus(`🔒 Encrypting... ${progress}%`, "info", progress);
                });

                // Verify encryption
                if (encryptedBlob.size < 32) {
                    throw new Error("Encryption failed (invalid output)");
                }

                updateStatus(`📤 Uploading ${file.name}...`, "info", 0);
                await uploadLargeFile(encryptedBlob, `${file.name}.crypted`, token, (progress) => {
                    updateStatus(`📤 Uploading... ${progress}%`, "info", progress);
                });

                updateStatus(`✅ ${file.name} uploaded!`, "success");
            } catch (error) {
                console.error(`Upload failed for ${file.name}:`, error);
                updateStatus(`❌ ${file.name} failed: ${error.message}`, "error");
            }
        }
    } catch (error) {
        updateStatus(`❌ Authentication failed: ${error.message}`, "error");
    }
});

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks for maximum reliability

async function uploadLargeFile(blob, fileName, token, onProgress) {
    return new Promise((resolve, reject) => {
        const port = chrome.runtime.connect({ name: "largeFileUpload" });
        let uploadCompleted = false;

        // Timeout after 10 minutes
        const timeout = setTimeout(() => {
            if (!uploadCompleted) {
                port.disconnect();
                reject(new Error("Upload timeout"));
            }
        }, 600000);

        port.onMessage.addListener(async (msg) => {
            try {
                if (msg.type === "progress") {
                    onProgress?.(msg.percent);
                } else if (msg.type === "complete") {
                    clearTimeout(timeout);
                    uploadCompleted = true;
                    port.disconnect();
                    resolve(true);
                } else if (msg.type === "error") {
                    throw new Error(msg.message);
                }
            } catch (error) {
                clearTimeout(timeout);
                port.disconnect();
                reject(error);
            }
        });

        sendFileChunks(port, blob, fileName, token).catch(error => {
            if (!uploadCompleted) {
                clearTimeout(timeout);
                port.disconnect();
                reject(error);
            }
        });
    });
}

async function sendFileChunks(port, blob, fileName, token) {
    const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);
    let chunkNumber = 0;

    // Send metadata first
    port.postMessage({
        type: "metadata",
        fileName: fileName,
        token: token,
        fileSize: blob.size,
        totalChunks: totalChunks
    });

    // Read file sequentially
    const reader = blob.stream().getReader();

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        chunkNumber++;
        port.postMessage({
            type: "chunk",
            chunk: Array.from(new Uint8Array(value)),
            chunkNumber: chunkNumber,
            isLast: chunkNumber === totalChunks
        });

        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 30));
    }
    reader.releaseLock();
}

// Helper function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}