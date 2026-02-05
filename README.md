# Expense Tracker App

A complete real-time expense tracking application with user authentication. Each user has their own account and data storage.

## Features

### User Authentication
- Email/Password registration
- Complete login/logout system
- Separate data for each user

### Expense Management
- Add expenses easily
- View all expenses list
- Delete expenses
- Filter by date and category
- Export data in CSV format

### Reports & Analytics
- Monthly report generation
- Pie chart by category
- Bar chart by day
- Category-wise breakdown

### Budget Planning
- Set monthly budget
- Track budget vs expenses
- Smart budget alerts

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

### Method 1: Direct Use (Easiest)

1. Clone the repository:
```bash
git clone https://github.com/rahatmushfiqabir/expense-tracker.git
cd expense-tracker
```

2. Open `index.html` in browser

### Method 2: Run on Local Server

```bash
# Using Python 3
python -m http.server 8000

# Or using Node.js
npx serve
```

Then visit `http://localhost:8000`

### Method 3: Host on Netlify (Free)

1. Go to https://app.netlify.com/drop
2. Drag and drop the project folder
3. Get instant live link!

## Setup Configuration

### Firebase Configuration

1. Create a new project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** (Email/Password)
3. Enable **Firestore Database** (Test Mode)
4. Add a Web App and copy the config
5. Update `firebaseConfig` in `index.html`

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: " "YOUR_PROJECT_ID",
  // ...
};
```

### Firestore Security Rules

Add these rules in Firestore Rules tab:

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

- [ ] Dark Mode support
- [ ] Multi-currency support
- [ ] Split expenses
- [ ] Reminder system
- [ ] Password reset
- [ ] PDF report generation
- [ ] Data backup/restore

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
