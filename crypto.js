// Derive a cryptographic key from a password using PBKDF2 for AES-256
async function deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 200000, // Increased iteration count for stronger protection
            hash: "SHA-256",    // Secure hash algorithm
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 }, // Derive a 256-bit key for AES-GCM
        false, // Do not export the key
        ["encrypt", "decrypt"]
    );
}

// Encrypt a file using AES-GCM with AES-256 in chunks
async function encryptFile(file, password, onProgress) {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const salt = crypto.getRandomValues(new Uint8Array(16)); // 128-bit salt
    const key = await deriveKey(password, salt);

    const chunkSize = 100 * 1024 * 1024; // 100MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    let encryptedChunks = [salt, iv];

    for (let i = 0; i < totalChunks; i++) {
        const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
        const chunkBuffer = await chunk.arrayBuffer();

        const encryptedChunk = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            chunkBuffer
        );

        encryptedChunks.push(new Uint8Array(encryptedChunk));

        // Report progress if callback provided
        if (onProgress) {
            const progress = Math.round(((i + 1) / totalChunks) * 100);
            onProgress(progress);
        }
    }

    return new Blob(encryptedChunks, { type: "application/octet-stream" });
}

// Decrypt a file using AES-GCM with AES-256 in chunks
async function decryptFile(encryptedFile, password, onProgress) {
    try {
        const salt = await readChunk(encryptedFile, 0, 16); // 128-bit salt
        const iv = await readChunk(encryptedFile, 16, 12); // 96-bit IV
        const key = await deriveKey(password, salt);

        const chunkSize = 100 * 1024 * 1024; // 100MB chunks
        let decryptedChunks = [];
        let offset = 28; // After salt + IV
        let chunkIndex = 0;
        const totalChunks = Math.ceil((encryptedFile.size - offset) / chunkSize);

        while (offset < encryptedFile.size) {
            const chunk = await readChunk(encryptedFile, offset, chunkSize);
            const decryptedChunk = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                chunk
            );
            decryptedChunks.push(new Uint8Array(decryptedChunk));
            offset += chunk.byteLength;
            chunkIndex++;

            // Report progress if callback provided
            if (onProgress) {
                const progress = Math.round((offset / encryptedFile.size) * 100);
                onProgress(progress);
            }
        }

        return new Blob(decryptedChunks, { type: "application/octet-stream" });
    } catch (error) {
        console.error("Decryption error:", error);
        throw error;
    }
}

// Helper function to read file chunks
async function readChunk(file, start, size) {
    const slice = file.slice(start, start + size);
    return await new Response(slice).arrayBuffer();
}
