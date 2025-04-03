// 🔥 Update Status Messages with Progress Bar
function updateStatus(message, type, progress = null) {
    const status = document.getElementById("status");
    status.innerHTML = ''; // Clear previous content

    // Create message element
    const messageEl = document.createElement("div");
    messageEl.textContent = message;
    messageEl.style.marginBottom = progress !== null ? "5px" : "0";

    // Create progress container if needed
    let progressBar = null;
    if (progress !== null) {
        progressBar = document.createElement("div");
        progressBar.style.width = "100%";
        progressBar.style.height = "10px";
        progressBar.style.backgroundColor = "#e0e0e0";
        progressBar.style.borderRadius = "5px";
        progressBar.style.overflow = "hidden";

        const progressInner = document.createElement("div");
        progressInner.style.width = `${progress}%`;
        progressInner.style.height = "100%";
        progressInner.style.backgroundColor = type === "error" ? "#dc3545" : 
                                               type === "success" ? "#28a745" : "#007bff";
        progressInner.style.transition = "width 0.3s ease";

        progressBar.appendChild(progressInner);
    }

    // Append elements to status
    status.appendChild(messageEl);
    if (progressBar) status.appendChild(progressBar);

    console.log(`[STATUS] ${message} ${progress !== null ? `(${progress}%)` : ''}`);

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
        textAlign: "left", // Changed to left for better progress bar alignment
        opacity: "1"
    });

    // Only auto-hide if there's no progress bar
    if (progress === null) {
        setTimeout(() => { status.style.opacity = "0"; }, 5000);
    }
}

// Helper function for upload
async function uploadFileToDrive(blob, filename, token) {
    return new Promise((resolve) => {
        // Create a new FileReader to ensure proper data handling
        const reader = new FileReader();
        reader.onload = function () {
            chrome.runtime.sendMessage(
                {
                    action: "uploadToGoogleDrive",
                    file: reader.result,  // Pass ArrayBuffer directly
                    fileName: filename,
                    token: token,
                    mimeType: "application/octet-stream"
                },
                (response) => {
                    if (response?.error) {
                        console.error("Upload error:", response.error);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                }
            );
        };
        reader.readAsArrayBuffer(blob);
    });
}


