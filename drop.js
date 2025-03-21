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
    handleFiles(event.dataTransfer.files);
});

// 📂 File Input Selection
fileInput.addEventListener("change", (event) => {
    handleFiles(event.target.files);
});

// 🔄 Handle Selected Files & Prevent Duplicates
function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) {
            selectedFiles.push(file);
            displayFile(file);
        }
    });

    window.selectedFiles = selectedFiles; // Store selected files globally
}

// 📜 Display File List with Remove Option
function displayFile(file) {
    const li = document.createElement("li");
    li.innerHTML = `
        ${file.name} 
        <button class="remove-file" data-name="${file.name}">X</button>
    `;
    fileList.appendChild(li);

    // ❌ Remove File Button
    li.querySelector(".remove-file").addEventListener("click", function () {
        removeFile(file.name);
    });
}

// ❌ Remove File from List
function removeFile(fileName) {
    selectedFiles = selectedFiles.filter(f => f.name !== fileName);
    renderFileList();
}

// 🔄 Update File List UI
function renderFileList() {
    fileList.innerHTML = "";
    selectedFiles.forEach(file => displayFile(file));
}

// 🔄 Clear File Selection (Called after Upload or Encryption)
function clearSelectedFiles() {
    selectedFiles = [];
    fileList.innerHTML = "";
}
