# Expense Tracker App

A complete real-time expense tracking application with user authentication. Each user has their own account and data storage.

## Features

### User Authentication
- Email/Password registration
- Complete login/logout system
- Separate data for each user
- Secure session management

### Expense Management
- Add expenses easily
- View all expenses list
- Edit existing expenses
- Delete expenses with confirmation
- Filter by date and category
- Export data in CSV format
- Export expense list as PDF

### Reports & Analytics
- Monthly report generation
- Pie chart by category
- Bar chart by day
- Category-wise breakdown

### Budget Planning
- Set monthly budget
- Category-wise budget allocation
- Visual progress indicators
- Smart budget alerts
- Delete budgets with confirmation

### UI/UX Features
- Dark mode support
- Professional modal dialogs
- Responsive design
- Bengali language support
- Smooth animations

### Real-time Sync
- Auto sync with Firebase Firestore
- Access same account on multiple devices
- Access from anywhere

## Tech Stack

### Frontend
- HTML5 - Semantic markup
- CSS3 - Responsive design
- JavaScript (ES6+) - Interactive features

### Backend
- Firebase Authentication - User management
- Cloud Firestore - NoSQL database
- Real-time Sync - Live data updates

### Libraries
- Chart.js - Beautiful charts and graphs
- Firebase SDK - Authentication and database

## Installation

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional, but recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/rahatmushfiqabir/expense-tracker.git
cd expense-tracker
```

### Step 2: Firebase Setup (Required)

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" or use existing one

2. **Enable Authentication**
   - Build → Authentication
   - Get Started → Email/Password
   - Enable "Email/Password" provider

3. **Enable Firestore Database**
   - Build → Firestore Database
   - Create Database
   - Start in **Test Mode** (we'll update rules later)

4. **Get Firebase Config**
   - Project Settings (gear icon) → General
   - Scroll to "Your apps" section
   - Click "Add app" → Web (</>)
   - Copy the config values

5. **Create config.js File**
   ```bash
   cp config.example.js config.js
   ```

6. **Edit config.js** with your Firebase credentials:
   ```javascript
   window.firebaseConfig = {
     apiKey: "YOUR_API_KEY_HERE",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.firebasestorage.app",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

7. **Deploy Firestore Security Rules**
   - Open `firestore.rules` file from this repo
   - Copy the content
   - Go to Firebase Console → Firestore → Rules tab
   - Paste and click "Publish"

8. **Set API Key Restrictions** (Important!)
   - Firebase Console → Project Settings → API Keys
   - Find your "Browser key"
   - Application restrictions:
     - ✅ HTTP referrers
     - Add: `localhost:*`, `127.0.0.1:*`
   - API restrictions:
     - ✅ Restrict key
     - Select: "Identity Toolkit API" and "Cloud Firestore API"

### Step 3: Run the App

**Option A: Using Python**
```bash
python -m http.server 8000
```

**Option B: Using Node.js**
```bash
npx serve
```

**Option C: Direct Browser**
- Simply open `index.html` in your browser (some features may be limited)

Then visit `http://localhost:8000`

### Firestore Security Rules

The project includes `firestore.rules` with secure rules. Deploy them:

1. Firebase Console → Firestore Database → Rules tab
2. Copy content from `firestore.rules` file
3. Click "Publish"

## Usage

### 1. Register Account
- Create account with name, email, and password

### 2. Add Expense
- Enter date, category, amount, and description
- Click "Add Expense" button

### 3. View Reports
- Go to "Reports" tab
- Select month
- View charts and breakdowns

### 4. Set Budget
- Go to "Budget" tab
- Enter month and amount
- Track your budget

## Upcoming Features

- [ ] Multi-currency support
- [ ] Split expenses (shared expenses)
- [ ] Expense reminder system
- [ ] Password reset via email
- [ ] Data export/import (backup/restore)
- [ ] Expense categories customization
- [ ] Recurring expenses automation

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Developer

Developed and designed by [Rahat Mushfiq Abir](https://github.com/rahatmushfiqabir)

- GitHub: [@rahatmushfiqabir](https://github.com/rahatmushfiqabir)
- Email: abir_rahat@yahoo.com

## Support

If this project helps you, please support:

- Star the repository
- Fork it
- Open an issue

## Contact

- Project: [https://github.com/rahatmushfiqabir/expense-tracker](https://github.com/rahatmushfiqabir/expense-tracker)
- Email: abir_rahat@yahoo.com

---

Made with love by [Rahat Mushfiq Abir](https://github.com/rahatmushfiqabir)
