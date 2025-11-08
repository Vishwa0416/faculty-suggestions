# 🎓 Faculty Suggestions

The **Faculty Suggestions** web application is a simple and efficient digital platform that replaces traditional suggestion boxes. It allows students and lecturers to easily submit feedback, ideas, and recommendations to their respective departments within the Faculty of Management Studies.

## 🚀 Features

- Multi-step form with role selection (Student/Teacher)
- Department selection dropdown
- Suggestion input with optional email
- Anti-spam honeypot field
- Real-time popup notifications for feedback
- Integration with **Google Apps Script** for backend data handling
- Responsive and lightweight — no frameworks required

---

## 🧩 Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Google Apps Script (Web App endpoint)  
- **Hosting:** Any static hosting (e.g., GitHub Pages, Netlify)

---

## 📖 How It Works

1. Open the Faculty Suggestions web page.
2. Choose your role — *Student* or *Teacher*.
3. Select your department.
4. Enter your suggestion (and optionally your email).
5. Click **Send Suggestion**.
6. Your message will be securely sent to the department head’s inbox via the integrated Google Apps Script.

---
## 🧰 Example Google Apps Script (Backend)

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID').getSheetByName('Suggestions');
  sheet.appendRow([
    new Date(),
    data.role,
    data.department,
    data.suggestion,
    data.senderEmail
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}


## ✨ Credits

Developed by Vishwa Wijesekare
Faculty of Computing, Sabaragamuwa University of Sri Lanka

## 📬 Feedback

If you encounter issues or have improvement ideas, feel free to open an issue or submit a pull request!

## 🧠 Setup Instructions

### Clone the Repository
```bash
git clone https://github.com/<your-username>/faculty-suggestions.git
cd faculty-suggestions
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

faculty-suggestions/
│
├── index.html      # Main web page
├── /assets         # (Optional) Images or icons
└── README.md       # Documentation 

