// ==========================================
// FIREBASE CONFIG - উদাহরণ ফাইল
// ==========================================
//
// SETUP INSTRUCTIONS:
// 1. এই ফাইলটি copy করে config.js নামে সেভ করুন
// 2. আপনার Firebase Console থেকে configuration নিন
// 3. নিচের placeholder values পরিবর্তন করুন
//
// আপনার Firebase Console থেকে এই values পাবেন:
// 1. Firebase Console এ যান (https://console.firebase.google.com/)
// 2. আপনার project select করুন (অথবা নতুন project তৈরি করুন)
// 3. Project Settings (gear icon) → General → Your apps
// 4. "Add app" → Web (</>) → Copy config values
//
// IMPORTANT: অবশ্যই Firestore enable করবেন:
// - Build → Firestore Database → Create Database
// - Start in Test Mode → পরে rules update করবেন
// - firestore.rules ফাইল deploy করুন Firebase Console থেকে

window.firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// API Key Restriction (Security Best Practice):
// Firebase Console → Project Settings → API Keys → Browser Key
// Application restrictions:
//   - HTTP referrers: localhost:*, 127.0.0.1:*, YOUR_DOMAIN
// API restrictions:
//   - Restrict key: Identity Toolkit API, Cloud Firestore API

