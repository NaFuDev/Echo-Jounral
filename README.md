🌿 Echo Journal
Echo Journal is a web-based journaling application that uses artificial intelligence to act as a personal co-pilot for self-reflection. It goes beyond simple text entry by providing insightful prompts and a secure, private space for your thoughts.

✨ Features
📝 The Echo Feature: After you save an entry, the AI generates personalized, reflective questions tailored to your writing, encouraging deeper thought.

🔐 Secure & Private: All journal entries are stored securely in a private database (Firestore), accessible only by you.

💡 AI-Powered Insights: (Future Feature) The app will analyze your entries over time to provide insights into your emotional patterns and recurring themes.

📱 Cross-Device Access: Sign in with your Google account to access your journal from any device.

🌙 Dark & Light Mode: Choose the theme that best suits your eyes and environment.

🚀 Technologies
Frontend: React with Vite

Styling: Tailwind CSS

State Management: React Hooks (useState, useEffect)

Backend & Database: Firebase (Authentication and Firestore)

Artificial Intelligence: Google's Gemini API

📦 Setup & Installation
To run this project locally, you'll need Node.js installed.

Clone the repository:

git clone https://github.com/NaFuDev/Echo-jounral.git
cd echo-journal

Install dependencies:

npm install

Set up Firebase & Gemini:

Create a new project in the Firebase Console.

Enable Firestore and Authentication (specifically Google sign-in).

Copy your Firebase configuration object.

Create a new project in Google AI Studio and get your Gemini API key.

Create a .env file in the root of your project and add your keys:

VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
# ... other Firebase config variables
VITE_GEMINI_API_KEY="your-gemini-key"

Run the application:

npm run dev

The app will be available at http://localhost:5173.

🤝 Contributing
Contributions are what make the open-source community an amazing place to learn and create. Any contributions you make are greatly appreciated.

Fork the project.

Create your feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.
