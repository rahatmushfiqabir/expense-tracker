# 💰 আমার খরচের হিসাব | Expense Tracker

<div align="center">

![GitHub Issues](https://img.shields.io/github/issues/username/expense-tracker)
![GitHub Stars](https://img.shields.io/github/stars/username/expense-tracker)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

একটি সম্পূর্ণ **রিয়েল-টাইম খরচ ট্র্যাকার অ্যাপ্লিকেশন** যা প্রতিটি ব্যবহারকারীর জন্য আলাদা অ্যাকাউন্ট এবং ডেটা সংরক্ষণ করে।

[🚀 Live Demo](#) • [📖 Documentation](#features) • [🤝 Contributing](#contributing)

</div>

---

## ✨ ফিচারসমূহ (Features)

### 🔐 ইউজার অথেন্টিকেশন
- ✅ Email/Password দিয়ে রেজিস্ট্রেশন
- ✅ সম্পূর্ণ লগইন/লগআউট সিস্টেম
- ✅ প্রতিটি ইউজারের আলাদা ডেটা

### 💰 খরচ ম্যানেজমেন্ট
- ➕ খুব সহজে খরচ যোগ করা
- 📋 সব খরচের তালিকা দেখা
- 🗑️ খরচ ডিলিট করা
- 🔍 তারিখ ও ক্যাটাগরি দিয়ে ফিল্টার করা
- 📤 CSV ফরম্যাটে ডেটা এক্সপোর্ট

### 📊 রিপোর্ট ও অ্যানালিসিস
- 📈 মাসিক রিপোর্ট জেনারেট
- 🥧 ক্যাটাগরি অনুযায়ী পাই চার্ট
- 📅 দিন অনুযাযীী বার চার্ট
- 💡 ক্যাটাগরি ভিত্তিক ব্রেকডাউন

### 🎯 বাজেট প্ল্যানিং
- 💎 মাসিক বাজেট সেট করা
- 📊 বাজেট বনাম খরচ ট্র্যাকিং
- ⚠️ স্মার্ট বাজেট অ্যালার্ম

### 🔥 রিয়েল-টাইম সিঙ্ক
- ☁️ Firebase Firestore দিয়ে অটোমেটিক সিঙ্ক
- 📱 একাধিক ডিভাইসে একই অ্যাকাউন্ট
- 🌍 যেকোনো জায়গা থেকে অ্যাক্সেস

---

## 🛠️ টেকনোলজি ব্যবহৃত (Tech Stack)

### ফ্রন্টএন্ড
- **HTML5** - সিম্যান্টিক মার্কআপ
- **CSS3** - রেসপন্সিভ ডিজাইন
- **JavaScript (ES6+)** - ইন্টারঅ্যাক্টিভ ফিচার

### ব্যাকএন্ড
- **Firebase Authentication** - ইউজার ম্যানেজমেন্ট
- **Cloud Firestore** - NoSQL ডেটাবেস
- **Real-time Sync** - লাইভ ডেটা আপডেট

### লাইব্রেরি
- **Chart.js** - সুন্দর চার্ট ও গ্রাফ
- **Firebase SDK** - অথেন্টিকেশন ও ডেটাবেস

---

## 🚀 কীভাবে ইনস্টল করবেন (Installation)

### পদ্ধতি ১: সরাসরি ব্যবহার (সবচেয়ে সহজ)

১. রিপোজিটরি ক্লোন করুন:
```bash
git clone https://github.com/your-username/expense-tracker.git
cd expense-tracker
```

২. `index.html` ফাইল ব্রাউজারে ওপেন করুন

### পদ্ধতি ২: লোকাল সার্ভারে চালানো

```bash
# Python 3 ব্যবহার করে
python -m http.server 8000

# বা Node.js ব্যবহার করে
npx serve
```

এরপর `http://localhost:8000` এ যান

### পদ্ধতি ৩: Netlify এ হোস্ট করা (ফ্রি)

১. https://app.netlify.com/drop যান
২. প্রজেক্ট ফোল্ডার ড্রাগ করে ফেলে দিন
৩. মুহূর্তি লাইভ লিংক পান! ⚡

---

## ⚙️ সেটআপ কনফিগারেশন (Setup)

### Firebase কনফিগারেশন

১. [Firebase Console](https://console.firebase.google.com/) এ নতুন প্রজেক্ট তৈরি করুন
২. **Authentication** চালু করুন (Email/Password)
৩. **Firestore Database** চালু করুন (Test Mode)
৪. Web App যোগ করুন এবং কনফিগ কপি করুন
৫. `index.html` এ `firebaseConfig` আপডেট করুন

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ...
};
```

### Firestore Security Rules

Firestore Rules ট্যাবে এই কোড বসান:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    match /budgets/{budgetId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 📸 স্ক্রিনশট (Screenshots)

### লগইন পেজ
![Login Page](screenshots/login.png)

### ড্যাশবোর্ড
![Dashboard](screenshots/dashboard.png)

### মাসিক রিপোর্ট
![Reports](screenshots/reports.png)

---

## 📖 ব্যবহারের নির্দেশ (Usage)

### ১. রেজিস্ট্রেশন করা
- নাম, ইমেইল, পাসওয়ার্ড দিয়ে অ্যাকাউন্ট তৈরি করুন

### ২. খরচ যোগ করা
- তারিখ, ক্যাটাগরি, টাকা ও বিবরণ লিখুন
- "খরচ যোগ করুন" বাটনে ক্লিক করুন

### ৩. রিপোর্ট দেখা
- "রিপোর্ট" ট্যাবে যান
- মাস সিলেক্ট করুন
- সুন্দর চার্ট ও ব্রেকডাউন দেখুন

### ৪. বাজেট সেট করা
- "বাজেট" ট্যাবে যান
- মাস ও বাজেটের পরিমাণ দিন
- বাজেট ট্র্যাক করুন

---

## 🌟 ভবিষ্যত ফিচার (Upcoming Features)

- [ ] Dark Mode সাপোর্ট
- [ ] মাল্টি-কারেন্সি সাপোর্ট
- [ ] খরচ শেয়ার করা (Split Expenses)
- [ ] রিমাইন্ডার সিস্টেম
- [ ] পাসওয়ার্ড রিসেট করা
- [ ] PDF রিপোর্ট জেনারেট
- [ ] ডাটা ব্যাকআপ রিস্টোর

---

## 🤝 কন্ট্রিবিউশন (Contributing)

কন্ট্রিবিউশন করতে আগ্রহীত স্বাগত! 😊

১. রিপোজিটরি ফর্ক করুন
২. আপনার ফিচার ব্রাঞ্চ (`git checkout -b feature/AmazingFeature`)
৩. কমিট করুন (`git commit -m 'Add some AmazingFeature'`)
৪. পুশ করুন (`git push origin feature/AmazingFeature`)
৫. Pull Request খুলুন

---

## 📝 লাইসেন্স (License)

এই প্রজেক্টটি MIT লাইসেন্সের অধীনে লাইসেন্সকৃত - [LICENSE](LICENSE) ফাইল দেখুন

---

## 👨‍💻 ডেভেলপার (Developer)

তৈরি করেছেন এবং ডিজাইন করেছেন - **[আপনার নাম](https://github.com/username)**

- GitHub: [@username](https://github.com/username)
- Email: your-email@example.com

---

## 🙏 সমর্থন (Support)

যদি এই প্রজেক্টটি আপনার উপকারে আসে, তাহলে:

- ⭐ স্টার দিন
- 🍴 ফর্ক করুন
- 🐛 ইস্যু রিপোর্ট করুন

---

## 📧 যোগাযোগ (Contact)

- প্রজেক্ট লিংক: [https://github.com/username/expense-tracker](https://github.com/username/expense-tracker)
- ইমেইল: your-email@example.com

---

<div align="center">

**মন্তব্য করুন বা পরামর্শ দিন! 💬**

Made with ❤️ by [Your Name](https://github.com/username)

</div>
