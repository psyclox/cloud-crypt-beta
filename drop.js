// 🌐 Select Elements
const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");

let selectedFiles = []; // Array to store selected files

// 🖱️ Drag & Drop File Handling
dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.classList.add("drag-over");
});

dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("drag-over");
});

dropArea.addEventListener("drop", (event) => {
    event.preventDefault();
    dropArea.classList.remove("drag-over");
    handleFiles(Array.from(event.dataTransfer.files));
});

// 📂 File Input Selection
fileInput.addEventListener("change", (event) => {
    handleFiles(Array.from(event.target.files));
});

// 🔄 Handle Selected Files & Prevent Duplicates
function handleFiles(newFiles) {
    // Filter out duplicates by name and size
    newFiles = newFiles.filter(newFile => 
        !selectedFiles.some(existingFile => 
            existingFile.name === newFile.name && 
            existingFile.size === newFile.size
        )
    );
    
    if (newFiles.length > 0) {
        selectedFiles = [...selectedFiles, ...newFiles];
        updateFilesUI();
    }
}

// ❌ Remove File from List
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFilesUI(); // Use this instead of renderFileList()

    // If no files are left, reset the file input
    if (selectedFiles.length === 0) {
        document.getElementById('fileInput').value = '';
    }
}

// 🧹 Clear Selected Files
function clearSelectedFiles() {
    selectedFiles = [];
    renderFileList();
}

function renderFileList() {
    fileList.innerHTML = ""; // Clear previous list

    selectedFiles.forEach((file, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${file.name}</span> 
            <button class="remove-file" data-index="${index}"></button>
        `;

        fileList.appendChild(li);
    });

    // Attach event listeners to remove buttons
    document.querySelectorAll(".remove-file").forEach(button => {
        button.addEventListener("click", function () {
            const index = parseInt(this.getAttribute("data-index"), 10);
            removeFile(index);
        });
    });

    adjustContainerHeight();
}

// 🏗 Adjust Container Height Based on Content
function adjustContainerHeight() {
    const container = document.getElementById("container");
    const baseHeight = 450;  // Default height
    const fileListHeight = fileList.scrollHeight; // Dynamic file list height

    // Set height with smooth transition
    container.style.height = `${baseHeight + Math.min(fileListHeight, 150)}px`;
}

// Update files UI
function updateFilesUI() {
    const hasFiles = selectedFiles.length > 0;
    const countContainer = document.getElementById('filesCountContainer');
    const fileList = document.getElementById('fileList');
    const dropArea = document.getElementById('drop-area');

    // Always show the drop area
    if (dropArea) {
        dropArea.style.display = 'block';
    }

    // Always show the count container, just update its content
    if (countContainer) {
        countContainer.style.display = 'block';
    }

    // Show or hide the file list based on whether there are files
    if (fileList) {
        fileList.style.display = hasFiles ? 'block' : 'none';
    }

    // Update the file count
    const filesCount = document.getElementById('filesCount');
    if (filesCount) {
        filesCount.textContent = selectedFiles.length;
    }

    // Update the file list if there are files
    if (hasFiles) {
        updateFileList();
    }
}

// Clear all files
document.getElementById('clearFilesBtn').addEventListener('click', () => {
    selectedFiles = [];
    document.getElementById('fileInput').value = '';
    updateFilesUI();
    updateStatus('Cleared all selected files', 'info');
});

// Update file list with remove buttons
function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = selectedFiles.map((file, index) => `
        <li>
            <span class="file-name" title="${file.name}">${truncateFileName(file.name)}</span>
            <button class="remove-file-btn" data-index="${index}">✕</button>
        </li>
    `).join('');
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-file-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            selectedFiles.splice(index, 1);
            updateFilesUI();
        });
    });
}

// Helper function to truncate long filenames
function truncateFileName(name, maxLength = 30) {
    if (name.length <= maxLength) return name;
    
    const extensionIndex = name.lastIndexOf('.');
    if (extensionIndex === -1) {
        // No extension present
        return name.substring(0, maxLength - 3) + '...';
    }
    
    const extension = name.substring(extensionIndex);
    const baseName = name.substring(0, extensionIndex);
    const baseMax = maxLength - extension.length - 3;
    
    // Ensure at least 3 characters of the base name are shown
    return baseName.substring(0, Math.max(3, baseMax)) + '...' + extension;
}

function updateFilesCount() {
    const count = selectedFiles.length;
    const bubble = document.getElementById('filesCountBubble');
    const countElement = document.getElementById('filesCount');
    
    countElement.textContent = count;
    
    if (count > 0) {
        bubble.style.display = 'inline-block';
    } else {
        bubble.style.display = 'none';
    }
}

// Helper function to format file sizes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Clear files function
document.getElementById('clearFilesBtn').addEventListener('click', () => {
    selectedFiles = [];
    document.getElementById('fileInput').value = ''; // Clear file input
    updateFilesUI();
    updateStatus('Cleared all selected files', 'info');
});

// Example file input change handler
document.getElementById('fileInput').addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
});
