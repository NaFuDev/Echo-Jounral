import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, addDoc, onSnapshot, collection, query, serverTimestamp, orderBy } from 'firebase/firestore';

// Icon components (using inline SVGs to avoid external dependencies)
const FeatherIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-feather"><path d="M20.24 12.24l-8.5-8.5C11.69 3.29 11.29 3 10.88 3H4a2 2 0 0 0-2 2v6.88c0 .41.29.81.54 1.06l8.5 8.5c.92.92 2.19 1.43 3.51 1.43s2.59-.51 3.51-1.43l3.51-3.51c.92-.92 1.43-2.19 1.43-3.51s-.51-2.59-1.43-3.51z"></path><path d="M12.5 11.5l3.5-3.5"></path><path d="M15 15l-4-4"></path><path d="M11.5 12.5l-3.5 3.5"></path></svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M4.93 19.07l1.41-1.41"></path><path d="M17.66 6.34l1.41-1.41"></path></svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
);
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
);


const App = () => {
  // State variables for the application
  const [newEntry, setNewEntry] = useState('');
  const [entries, setEntries] = useState([]);
  const [aiPrompts, setAiPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- Firebase Initialization and Authentication ---
  useEffect(() => {
    // For a real project, use environment variables from a .env file
    // const firebaseConfig = {
    //   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    //   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    //   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    //   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    //   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    //   appId: import.meta.env.VITE_FIREBASE_APP_ID,
    // };

    // The following variables are provided by the canvas environment for testing.
    // Replace with the code above for a real project.
    const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


    if (Object.keys(firebaseConfig).length === 0) {
      console.error("Firebase config is not available. Please set up your .env file.");
      setError("Firebase not configured. Please check the environment setup.");
      return;
    }

    try {
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);
      setDb(firestoreDb);
      setAuth(firebaseAuth);

      // Listen for auth state changes to get the user ID
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(firebaseAuth, initialAuthToken);
            } else {
              await signInAnonymously(firebaseAuth);
            }
          } catch (e) {
            console.error("Auth failed:", e);
            setError("Authentication failed. Please try again.");
            setIsAuthReady(true);
          }
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Failed to initialize Firebase:", e);
      setError("Failed to initialize the app. Please check the console for details.");
    }
  }, []);

  // --- Manage Dark Mode ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Fetch Journal Entries from Firestore ---
  useEffect(() => {
    if (isAuthReady && db && userId) {
      const q = query(
        collection(db, `/artifacts/${__app_id}/users/${userId}/entries`),
        orderBy("timestamp", "desc")
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedEntries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEntries(fetchedEntries);
      }, (e) => {
        console.error("Failed to fetch entries:", e);
        setError("Could not retrieve journal entries.");
      });

      return () => unsubscribe();
    }
  }, [isAuthReady, db, userId]);

  // --- Gemini API Call Function with Exponential Backoff ---
  const callGeminiApi = async (prompt) => {
    // For a real project, use an environment variable
    // const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{ text: `Based on the following journal entry, generate three thoughtful, reflective questions for a user to consider. Format the questions as a JSON array of strings. The entry is: "${prompt}"` }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "STRING"
          }
        }
      }
    };

    let retries = 0;
    const maxRetries = 5;
    let delay = 1000;

    while (retries < maxRetries) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.warn(`API rate limit exceeded. Retrying in ${delay / 1000}s...`);
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
            retries++;
            continue;
          } else {
            throw new Error(`API call failed with status: ${response.status}`);
          }
        }

        const result = await response.json();
        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(jsonText);
      } catch (e) {
        console.error("Error calling Gemini API:", e);
        throw e;
      }
    }
    throw new Error("API call failed after multiple retries.");
  };

  // --- Handle saving the entry and triggering the AI prompt generation ---
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.trim()) return;

    setLoading(true);
    setAiPrompts([]);
    setError(null);

    try {
      const docRef = await addDoc(collection(db, `/artifacts/${__app_id}/users/${userId}/entries`), {
        text: newEntry,
        timestamp: serverTimestamp(),
      });
      setNewEntry('');
      
      const prompts = await callGeminiApi(newEntry);
      setAiPrompts(prompts);

    } catch (e) {
      console.error("Failed to save entry or get AI prompts:", e);
      setError("Failed to save your entry or generate prompts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Google Sign-in ---
  const handleGoogleSignIn = async () => {
    try {
      if (!auth) {
        setError("Auth service not available. Please try again later.");
        return;
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Google Sign-In failed:", e);
      setError("Google Sign-In failed. Please try again.");
    }
  };

  return (
    <div className={`min-h-screen bg-neutral-50 text-neutral-900 font-sans p-4 sm:p-8 flex flex-col items-center ${isDarkMode ? 'dark' : ''}`}>
      {/* User ID and Theme Toggle Display */}
      <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-600">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-50 dark:focus:ring-offset-neutral-900"
        >
          {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            <span className="truncate max-w-[150px]">{userId || "Authenticating..."}</span>
        </div>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">Echo Journal</h1>
          <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400 max-w-xl">
            Your personal co-pilot for self-reflection.
          </p>
        </header>

        {/* Auth Section */}
        {!userId && (
          <section className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-700 text-center">
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">Sign in to save your journal entries across devices.</p>
            <button
              onClick={handleGoogleSignIn}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-full shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
            >
              <GoogleIcon className="w-5 h-5" />
              Sign in with Google
            </button>
          </section>
        )}

        {/* Journal Entry Section */}
        {userId && (
          <section className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-700">
            <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Write Today's Entry</h2>
            <form onSubmit={handleSaveEntry} className="space-y-4">
              <textarea
                className="w-full h-40 p-4 bg-neutral-100 dark:bg-neutral-700 rounded-xl text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-50 dark:focus:ring-offset-neutral-900 resize-none"
                placeholder="What's on your mind today?"
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                required
              ></textarea>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-full shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !isAuthReady}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <>
                      <FeatherIcon className="w-5 h-5" />
                      Save & Reflect
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* AI Prompts Section */}
        {aiPrompts.length > 0 && (
          <section className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-700">
            <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Your Echo Prompts</h2>
            <div className="space-y-4">
              {aiPrompts.map((prompt, index) => (
                <div key={index} className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-xl text-neutral-700 dark:text-neutral-300">
                  <p className="font-medium">{prompt}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Past Entries Section */}
        <section className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-lg border border-neutral-200 dark:border-neutral-700">
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Past Entries</h2>
          {entries.length === 0 ? (
            <p className="text-center text-neutral-500 dark:text-neutral-400">Your journal is empty. Write your first entry above!</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-xl border border-neutral-200 dark:border-neutral-600">
                  <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap">{entry.text}</p>
                  <p className="mt-2 text-xs text-neutral-400 text-right">
                    {entry.timestamp ? new Date(entry.timestamp.toDate()).toLocaleString() : 'Saving...'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-xl shadow-md text-center">
            <p>{error}</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        /* Custom scrollbar for better aesthetics */
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #e5e5e5;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #a3a3a3;
            border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
            background: #262626;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #404040;
        }
        .dark {
            background-color: #171717; /* dark:bg-neutral-900 */
            color: #d4d4d4; /* dark:text-neutral-50 */
        }
      `}</style>
    </div>
  );
};

export default App;
