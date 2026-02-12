// ==========================================
// FIREBASE CONFIG - Production/Deploy
// ==========================================
//
// This file is used for deployments (GitHub Pages, Netlify)
// Environment variables are injected during build time
//
// Security: API Key has HTTP referrer restrictions applied

window.firebaseConfig = {
    apiKey: "{{FIREBASE_API_KEY}}",
    authDomain: "{{FIREBASE_AUTH_DOMAIN}}",
    projectId: "{{FIREBASE_PROJECT_ID}}",
    storageBucket: "{{FIREBASE_STORAGE_BUCKET}}",
    messagingSenderId: "{{FIREBASE_MESSAGING_SENDER_ID}}",
    appId: "{{FIREBASE_APP_ID}}"
};

// Fallback for local development if env vars not set
if (window.firebaseConfig.apiKey === "{{FIREBASE_API_KEY}}") {
    // Try to get from runtime config (Netlify/GitHub Pages)
    const runtimeConfig = {
        apiKey: "AIzaSyCTgHNhBs0QOBDrRV_wrgVhfODps-krR9g",
        authDomain: "expense-tracker-e7b16.firebaseapp.com",
        projectId: "expense-tracker-e7b16",
        storageBucket: "expense-tracker-e7b16.firebasestorage.app",
        messagingSenderId: "972650539076",
        appId: "1:972650539076:web:a1b0bf24e1f9969151b411"
    };

    // Only use fallback if we're on the deployed domain
    const deployedDomains = [
        'rahatmushfiqabir.github.io',
        'expense-tracker-e7b16.web.app',
        'fancy-gumption-0b4832.netlify.app',  // Your Netlify site
        'netlify.app',  // This matches any Netlify domain
        'localhost',
        '127.0.0.1'
    ];

    const currentDomain = window.location.hostname;
    console.log('🔍 Current domain:', currentDomain);

    const isDeployed = deployedDomains.some(domain => {
        const match = currentDomain.includes(domain) || currentDomain === domain;
        if (match) {
            console.log('✅ Domain matched:', domain);
        }
        return match;
    });

    if (isDeployed) {
        window.firebaseConfig = runtimeConfig;
        console.log('✅ Using deployed Firebase config');
        console.log('🔑 API Key:', runtimeConfig.apiKey.substring(0, 10) + '...');
    } else {
        console.error('❌ Firebase config not found. Please create config.js');
        throw new Error('Firebase config not found');
    }
}
