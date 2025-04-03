const FOLDER_NAME = "cloudcrypt";
const CLIENT_ID = '205530538210-0qr8mq95ird0u7jh8dkac3l6g651m1se.apps.googleusercontent.com';
const REDIRECT_URI = chrome.identity.getRedirectURL();
console.log("Redirect URI:", REDIRECT_URI); // Debugging: Log the redirect URI
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
    `client_id=${CLIENT_ID}&` +
    `response_type=token&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `prompt=consent&` +
    `include_granted_scopes=true`;

// Enhanced authentication manager
class AuthManager {
  static async getToken(interactive = false, forceAccountSelection = false) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken(
        {
          interactive,
          account: forceAccountSelection ? { id: '' } : undefined,
        },
        (token) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError;
            
            // Special handling for background checks
            if (!interactive && error.message.includes('not granted')) {
              console.log('Background check: No existing valid token');
              resolve(null); // Return null instead of rejecting
              return;
            }
            
            // Rest of error handling...
            console.error('Error obtaining token:', error.message);
            reject(error);
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  static async removeToken(token) {
    if (!token) {
      console.warn('Attempted to remove null token - skipping');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token: token }, () => {
        if (chrome.runtime.lastError) {
          console.warn('Token removal warning:', chrome.runtime.lastError);
        }
        resolve();
      });
    });
  }

  static async clearAllTokens() {
    try {
      // Get current token if exists
      let token;
      try {
        token = await this.getToken(false);
      } catch (e) {
        console.log('No existing token to clear');
      }

      // Clear cached token if exists
      if (token) {
        await this.removeToken(token);
      }

      // Clear local storage
      await chrome.storage.local.remove(['gdrive_token', 'user_email']);

      // Force new authentication
      const newToken = await this.getToken(true, true);

      if (!newToken) {
        throw new Error('Failed to obtain new token');
      }

      // Store new token
      await chrome.storage.local.set({ gdrive_token: newToken });

      return newToken;
    } catch (error) {
      console.error('Token clearing error:', error);
      throw error;
    }
  }
}

// Update the message handler to use proper ArrayBuffer transfer
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "backgroundUpload") {
    // Create a new ArrayBuffer from the transferred data
    const fileData = new Uint8Array(request.file).buffer;
    
    // Process upload without waiting
    handleBackgroundUpload({
      file: fileData,
      fileName: request.fileName,
      token: request.token
    });
    
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "startLargeUpload") {
    // Create a port for large file transfer
    const port = chrome.runtime.connect({ name: "largeFileUpload" });
    
    // Send initial metadata
    port.postMessage({
      type: "metadata",
      fileName: request.fileName,
      token: request.token
    });
    
    sendResponse({ success: true, port: port });
    return true;
  }

  const handleRequest = async () => {
    try {
      switch (request.action) {
        case "checkAuthStatus":
          try {
            // First try silently (non-interactive)
            const token = await AuthManager.getToken(false);
            
            // Verify the token is still valid
            const valid = await verifyToken(token);
            return { authenticated: valid };
          } catch (error) {
            console.log('Background auth check failed:', error.message);
            return { authenticated: false };
          }

        case "authenticateGoogleDrive":
          try {
            const token = await AuthManager.getToken(true);
            await chrome.storage.local.set({ gdrive_token: token });
            return { token };
          } catch (error) {
            if (error.message.includes('not granted') || 
                error.message.includes('revoked')) {
              console.log('Attempting to reauthenticate...');
              const newToken = await AuthManager.clearAllTokens();
              return { token: newToken };
            }
            throw error;
          }

        case "uploadFile":
          // Convert ArrayBuffer back to Blob
          const fileBlob = new Blob([request.file], { type: "application/octet-stream" });
          const { fileName, token } = request;

          // Upload the file to Google Drive
          const result = await uploadToDrive(fileBlob, fileName, token);
          return { success: true, ...result };

        case "uploadToGoogleDrive":
          // Handle the upload with Blob directly - MODIFIED VERSION
          const uploadResult = await handleGoogleDriveUpload({
            file: request.file,  // <- Changed: Pass Blob directly
            fileName: request.fileName,
            token: request.token,
          });
          return uploadResult;

        case "switchGoogleAccount":
          try {
            // Clear all tokens and force a new authentication
            const result = await AuthManager.clearAllTokens();
            return result; // Return the result from clearAllTokens
          } catch (error) {
            console.error("Account switching error:", error);
            return {
              error: "Failed to switch accounts. Please try again."
            };
          }

        default:
          throw new Error("Invalid action");
      }
    } catch (error) {
      console.error("Error handling request:", {
        request,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  handleRequest()
    .then(sendResponse)
    .catch((error) => {
      sendResponse({ 
        error: error.message,
        details: JSON.stringify(error) 
      });
    });

  return true; // Required for async response
});

// MODIFIED VERSION - handles ArrayBuffer directly
async function handleGoogleDriveUpload(request) {
    try {
        // Convert ArrayBuffer back to Blob
        const fileBlob = new Blob([request.file], { type: request.mimeType || "application/octet-stream" });

        const metadata = {
            name: request.fileName,
            mimeType: "application/octet-stream",
        };

        const formData = new FormData();
        formData.append(
            "metadata",
            new Blob([JSON.stringify(metadata)], { type: "application/json" })
        );
        formData.append("file", fileBlob);

        const response = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${request.token}`,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Drive API error: ${response.statusText}`);
        }
        
        return { success: true };
    } catch (error) {
        console.error("Upload failed:", error);
        return { error: error.message };
    }
}

// Updated handleBackgroundUpload function
async function handleBackgroundUpload(request) {
  try {
    const fileBlob = new Blob([request.file], { type: "application/octet-stream" });
    const metadata = {
      name: request.fileName,
      mimeType: "application/octet-stream",
    };

    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { 
      type: "application/json" 
    }));
    formData.append("file", fileBlob);

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${request.token}` },
        body: formData,
      }
    );

    if (response.ok) {
      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon_128.png'),
        title: 'Upload Complete',
        message: `${request.fileName} uploaded successfully`,
        priority: 1
      });
    } else {
      console.error("Upload failed:", await response.text());
    }
  } catch (error) {
    console.error("Background upload error:", error);
  }
}

// Function to upload file to Google Drive
async function uploadToDrive(fileBlob, fileName, token) {
  const metadata = {
    name: fileName,
    mimeType: "application/octet-stream",
  };

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], {
      type: "application/json",
    })
  );
  formData.append("file", fileBlob);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json();
}

// Updated handleLargeFileUpload function
async function handleLargeFileUpload(fileBlob, fileName, token) {
    try {
        console.log(`Uploading file: ${fileName}, Size: ${fileBlob.size} bytes`);

        const metadata = {
            name: fileName,
            mimeType: "application/octet-stream",
        };

        const formData = new FormData();
        formData.append(
            "metadata",
            new Blob([JSON.stringify(metadata)], { type: "application/json" })
        );
        formData.append("file", fileBlob);

        const response = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            }
        );

        if (response.ok) {
            console.log(`Upload successful: ${fileName}`);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon_128.png'),
                title: 'Upload Complete',
                message: `${fileName} uploaded successfully`,
                priority: 1
            });
            return true;
        }

        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        throw new Error(errorText);
    } catch (error) {
        console.error("Large file upload error:", error);
        return false;
    }
}

// Updated background handler
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "largeFileUpload") {
        const chunks = [];
        let metadata = null;
        let receivedSize = 0;

        port.onMessage.addListener(async (msg) => {
            try {
                if (msg.type === "metadata") {
                    // Initialize new upload
                    chunks.length = 0;
                    receivedSize = 0;
                    metadata = {
                        fileName: msg.fileName,
                        token: msg.token,
                        fileSize: msg.fileSize,
                        totalChunks: msg.totalChunks
                    };
                    port.postMessage({ type: "ready" });
                } 
                else if (msg.type === "chunk") {
                    if (!metadata) throw new Error("No metadata received");
                    
                    // Store chunk
                    const chunkData = new Uint8Array(msg.chunk);
                    chunks.push(chunkData);
                    receivedSize += chunkData.length;
                    
                    // Update progress
                    const percent = Math.round((receivedSize / metadata.fileSize) * 100);
                    port.postMessage({ type: "progress", percent });

                    // Finalize if all chunks received
                    if (msg.isLast || receivedSize === metadata.fileSize) {
                        await finalizeUpload();
                    }
                }
            } catch (error) {
                port.postMessage({ type: "error", message: error.message });
            }
        });

        async function finalizeUpload() {
            // Combine all chunks
            const fileData = new Uint8Array(metadata.fileSize);
            let offset = 0;
            
            for (const chunk of chunks) {
                fileData.set(chunk, offset);
                offset += chunk.length;
            }

            // Verify size
            if (offset !== metadata.fileSize) {
                throw new Error(`Size mismatch: expected ${metadata.fileSize} bytes, got ${offset} bytes`);
            }

            // Upload to Google Drive
            const formData = new FormData();
            formData.append("metadata", new Blob([JSON.stringify({
                name: metadata.fileName,
                mimeType: "application/octet-stream"
            })], { type: "application/json" }));
            formData.append("file", new Blob([fileData]));

            const response = await fetch(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${metadata.token}` },
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            port.postMessage({ type: "complete" });
        }

        port.onDisconnect.addListener(() => {
            chunks.length = 0;
        });
    }
});

// Extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension initialized");
  chrome.storage.local.set({ gdrive_token: null });
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "index.html" });
});

async function verifyToken(token) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token
    );
    return response.ok;
  } catch {
    return false;
  }
}