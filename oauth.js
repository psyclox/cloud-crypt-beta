// Handle Google Drive authentication status
async function updateAuthStatus(authenticated) {
    const authStatus = document.getElementById('authStatus');
    const accountInfo = document.getElementById('accountInfo');
    const accountEmail = document.getElementById('accountEmail');

    if (authenticated) {
        // Check if we already have the email in storage
        const storage = await chrome.storage.local.get(['user_email']);
        if (storage.user_email) {
            // Use the stored email
            accountEmail.textContent = storage.user_email;
            accountInfo.style.display = 'flex'; // Show account info
        } else {
            // Fallback to fetching user info
            try {
                const token = await new Promise(resolve => {
                    chrome.runtime.sendMessage({ action: 'authenticateGoogleDrive' }, resolve);
                });

                if (token?.token) {
                    const userInfo = await fetchUserInfo(token.token);
                    if (userInfo?.email) {
                        accountEmail.textContent = userInfo.email;
                        accountInfo.style.display = 'flex'; // Show account info
                        // Store the email for future use
                        await chrome.storage.local.set({ user_email: userInfo.email });
                    }
                }
            } catch (error) {
                console.error('Failed to get user info:', error);
            }
        }
    } else {
        if (accountInfo) accountInfo.style.display = 'none'; // Hide account info
    }

    if (authStatus) {
        authStatus.textContent = authenticated ? '✅ Authenticated' : '❌ Not Authenticated';
        authStatus.style.color = authenticated ? 'green' : 'red';
    }
}

// Helper function to fetch user info
async function fetchUserInfo(token) {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}

// On window load, check authentication status
window.onload = function () {
    // Check auth status on load
    chrome.runtime.sendMessage({ action: 'checkAuthStatus' }, async (response) => {
        await updateAuthStatus(response?.authenticated);
    });

    // Handle auth button click
    document.getElementById('authBtn')?.addEventListener('click', async () => {
        try {
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage(
                    { action: 'authenticateGoogleDrive' },
                    resolve
                );
            });

            if (response?.token) {
                await updateAuthStatus(true);
            } else {
                await updateAuthStatus(false);
                if (response?.error) {
                    console.error('Auth failed:', response.error);
                    if (response.error.includes('not granted')) {
                        alert('Please grant permissions in the popup window');
                    }
                }
            }
        } catch (error) {
            console.error('Auth process error:', error);
            await updateAuthStatus(false);
            alert('Authentication failed. Please try again.');
        }
    });
};