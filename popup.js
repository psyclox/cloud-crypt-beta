// 🌐 Global Variables
let selectedFiles = [];

// 🔥 Update Status Messages
function updateStatus(message, type) {
    const status = document.getElementById("status");
    status.textContent = message;

    const styles = {
        success: { color: "#155724", backgroundColor: "#D4EDDA", borderColor: "#C3E6CB" },
        error: { color: "#721C24", backgroundColor: "#F8D7DA", borderColor: "#F5C6CB" },
        info: { color: "#004085", backgroundColor: "#CCE5FF", borderColor: "#B8DAFF" }
    };

    const currentStyle = styles[type] || styles.info;
    Object.assign(status.style, {
        color: currentStyle.color,
        backgroundColor: currentStyle.backgroundColor,
        border: `1px solid ${currentStyle.borderColor}`,
        padding: "10px",
        borderRadius: "5px",
        marginTop: "10px",
        textAlign: "center",
        opacity: "1"
    });

    setTimeout(() => { status.style.opacity = "0"; }, 5000);
}

// 📂 Handle File Selection
document.getElementById("fileInput").addEventListener("change", (event) => {
    selectedFiles = Array.from(event.target.files);
    renderFileList();
});

function renderFileList() {
    const fileContainer = document.getElementById("fileList");
    fileContainer.innerHTML = "";

    selectedFiles.forEach((file, index) => {
        const fileElement = document.createElement("div");
        fileElement.className = "file-item";
        fileElement.innerHTML = `
            <span>${file.name}</span>
            <button class="remove-file" onclick="removeFile(${index})">X</button>
        `;
        fileContainer.appendChild(fileElement);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
}

// 🔒 Password Strength Checker
function checkPasswordStrength(password) {
    const strengthMeter = document.getElementById("passwordStrength");
    const strengthText = document.getElementById("strengthText");

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    const strengthColors = ["", "red", "red", "orange", "green"];
    const strengthTexts = ["", "Weak ❌", "Weak ❌", "Medium ⚠️", "Strong ✅"];

    strengthMeter.style.backgroundColor = strengthColors[strength];
    strengthText.innerText = strengthTexts[strength];
    strengthMeter.style.opacity = "1";
}

document.getElementById("passwordInput").addEventListener("input", function () {
    checkPasswordStrength(this.value);
});

// 🔒 Password Visibility Toggle
document.getElementById("togglePasswordIcon").addEventListener("click", function () {
    const passwordInput = document.getElementById("passwordInput");
    passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

// 🌓 Dark Theme Toggle (Fixed)
document.getElementById("darkModeToggle").addEventListener("change", function () {
    document.body.classList.toggle("dark-theme", this.checked);
});

// 📜 Hamburger Menu Toggle
document.getElementById("hamburgerMenu").addEventListener("click", function (event) {
    event.stopPropagation();
    document.getElementById("dropdownMenu").classList.toggle("show");
});

// ❌ Close Dropdown on Outside Click
document.addEventListener("click", function (event) {
    if (!document.getElementById("dropdownMenu").contains(event.target) && event.target !== document.getElementById("hamburgerMenu")) {
        document.getElementById("dropdownMenu").classList.remove("show");
    }
});

// 🧹 Clear Fields
function clearFields() {
    selectedFiles = [];
    document.getElementById("fileList").innerHTML = "";
    document.getElementById("passwordInput").value = "";
}

// 🔐 Encrypt Files (Fixed)
document.getElementById("encryptBtn").addEventListener("click", async function () {
    const password = document.getElementById("passwordInput").value;

    if (!password) {
        updateStatus("⚠️ Password is required for encryption!", "error");
        return;
    }

    if (selectedFiles.length === 0) {
        updateStatus("⚠️ No files selected for encryption!", "error");
        return;
    }

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
            const encryptedBlob = await encryptFile(file, password);
            downloadFile(encryptedBlob, file.name + ".encrypted");
            updateStatus(`${file.name} encrypted successfully! ✅`, "success");
        } catch (error) {
            updateStatus(`❌ Error encrypting ${file.name}: ${error.message}`, "error");
        }
    }

    // Clear fields **after encryption**
    setTimeout(clearFields, 1000);
});

// 🔓 Decrypt Files (Fixed)
document.getElementById("decryptBtn").addEventListener("click", async function () {
    const password = document.getElementById("passwordInput").value;

    if (!password) {
        updateStatus("⚠️ Password is required for decryption!", "error");
        return;
    }

    if (selectedFiles.length === 0) {
        updateStatus("⚠️ No files selected for decryption!", "error");
        return;
    }

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
            const decryptedBlob = await decryptFile(file, password);
            downloadFile(decryptedBlob, file.name.replace(".encrypted", ""));
            updateStatus(`${file.name} decrypted successfully! ✅`, "success");
        } catch (error) {
            updateStatus(`❌ Error decrypting ${file.name}: ${error.message}`, "error");
        }
    }

    // Clear fields **after decryption**
    setTimeout(clearFields, 1000);
});

// 📤 Upload to Google Drive (Fixed)
document.getElementById("uploadBtn").addEventListener("click", async function () {
    const password = document.getElementById("passwordInput").value;

    if (!password || selectedFiles.length === 0) {
        updateStatus("⚠️ Please select files and enter a password before uploading.", "error");
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

        const remainingFiles = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            try {
                const encryptedBlob = await encryptFile(file, password);
                updateStatus(`⬆️ Uploading ${file.name}...`, "info");

                const uploadSuccess = await uploadFileToDrive(encryptedBlob, `${file.name}.encrypted`, token);
                if (uploadSuccess) {
                    updateStatus(`✅ ${file.name} uploaded successfully!`, "success");
                } else {
                    updateStatus(`❌ Failed to upload ${file.name}.`, "error");
                    remainingFiles.push(file);
                }
            } catch (error) {
                updateStatus(`❌ Error during upload: ${error.message}`, "error");
                remainingFiles.push(file);
            }
        }

        // Keep only failed files
        selectedFiles = remainingFiles;
        renderFileList();

        if (selectedFiles.length === 0) {
            // Clear fields **only if all files were uploaded successfully**
            setTimeout(clearFields, 1000);
        }
    } catch (error) {
        updateStatus(`❌ Upload error: ${error.message}`, "error");
    }
});

// Utility: Download files
function downloadFile(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}
