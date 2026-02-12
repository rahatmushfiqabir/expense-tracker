// ==========================================
// FIREBASE CONFIG - Production/Deploy
// ==========================================
// Direct Firebase config for Netlify deployment
// This bypasses environment variable injection issues

window.firebaseConfig = {
    apiKey: "AIzaSyCTgHNhBs0QOBDrRV_wrgVhfODps-krR9g",
    authDomain: "expense-tracker-e7b16.firebaseapp.com",
    projectId: "expense-tracker-e7b16",
    storageBucket: "expense-tracker-e7b16.firebasestorage.app",
    messagingSenderId: "972650539076",
    appId: "1:972650539076:web:a1b0bf24e1f9969151b411"
};

console.log('✅ Firebase config loaded directly for deployment');
