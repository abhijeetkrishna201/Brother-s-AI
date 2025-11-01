# 🤖 Brother's AI Chatbot

[](https://opensource.org/licenses/MIT)
[](https://reactjs.org/)
[](https://www.typescriptlang.org/)
[](https://supabase.com/)

A modern, full-featured AI chatbot powered by Google's Gemini AI, built with React, TypeScript, and Supabase.

-----

## ✨ Features

### 🎯 Core Features

  * **AI-Powered Chat:** Natively integrated with Google's Gemini AI.
  * **User Authentication:** Secure, password-less Email OTP authentication via EmailJS.
  * **Cloud Database:** All conversations and user data are stored securely in a Supabase cloud database.
  * **Guest Mode:** Allows users to try the chatbot's core functionality without signing up.
  * **File Attachments:** Upload and send images to the AI for analysis.
  * **Voice Input:** Built-in speech-to-text for hands-free interaction.

### 🎨 User Experience

  * **Responsive Design:** Flawless experience on mobile, tablet, and desktop.
  * **Dark/Light Theme:** Smoothly-animated theme toggling to suit user preference.
  * **Conversation History:** Sidebar for browsing and resuming past conversations.
  * **Feedback Tools:** Like/Dislike buttons on AI responses to gather feedback.
  * **Quick Prompts:** A set of pre-built prompts to help users get started.

### 🔐 Admin Panel

  * **Centralized Configuration:** All API keys and settings are managed from a secure admin panel (no hardcoded keys).
  * **Profile Customization:** Ability to set a username and profile picture.
  * **Service Management:** Configure Supabase, EmailJS, and Gemini API keys directly from the UI.

-----

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion, Shadcn/ui |
| **Backend & Database** | Supabase (PostgreSQL, Auth, Realtime) |
| **AI & Services** | Google Gemini AI, EmailJS |
| **Libraries** | Lucide React (Icons), Sonner (Notifications), React Hook Form |

-----

## 🚀 Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

You will need accounts for the following services:

1.  **Node.js** (v18 or later)
2.  **Supabase Account** (for database and auth)
3.  **Google AI API Key** (for Gemini)
4.  **EmailJS Account** (for OTP emails)

### ⚙️ Installation & Configuration

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/brothers-ai.git
    cd brothers-ai
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create your environment file:**
    Copy the example file to a new file named `.env` in the root of the project.

    ```bash
    cp .env.example .env
    ```

4.  **Fill in your `.env` file:**
    Open the `.env` file and fill in all the values from your Supabase, EmailJS, and Google AI accounts. **Do not share this file.**

    ```env
    # .env

    # Supabase
    REACT_APP_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
    REACT_APP_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

    # EmailJS
    REACT_APP_EMAILJS_SERVICE_ID="YOUR_EMAILJS_SERVICE_ID"
    REACT_APP_EMAILJS_TEMPLATE_ID="YOUR_EMAILJS_TEMPLATE_ID"
    REACT_APP_EMAILJS_PUBLIC_KEY="YOUR_EMAILJS_PUBLIC_KEY"

    # Admin Credentials (choose your own secure credentials)
    REACT_APP_ADMIN_USERNAME="your-secure-admin-username"
    REACT_APP_ADMIN_PASSWORD="your-secure-admin-password"

    # The app will prompt the admin to enter the Gemini key via the UI
    # But you can pre-set it here if you wish
    REACT_APP_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

5.  **Set up the Database:**

      * Go to your Supabase project's **SQL Editor**.
      * Open the `/docs/SQL/SETUP_DATABASE.sql` file (or `/FIX_RLS_POLICY.sql`) from this repository.
      * Copy its contents, paste them into the SQL Editor, and click **RUN**. This creates all necessary tables and security policies.

6.  **Configure the EmailJS Template:**

      * Log in to your EmailJS dashboard.
      * Go to **Email Templates** and select the template matching your `REACT_APP_EMAILJS_TEMPLATE_ID`.
      * Ensure the **"To email"** field is set to `{{to_email}}`.
      * Save the template.

7.  **Run the application:**

    ```bash
    npm run dev
    ```

    Your app should now be running on `http://localhost:5173` (or similar).

8.  **Final Admin Setup:**

      * Open the app and click the **Admin** icon (gear) in the header.
      * Log in with the credentials you set in your `.env` file.
      * Go to the **API** tab and set your **Gemini API Key**.
      * Verify all settings are correct.

-----

## 📁 Project Structure

```
/
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable React components
│   │   ├── auth-page.tsx
│   │   ├── chat-area.tsx
│   │   ├── chat-sidebar.tsx
│   │   ├── admin-settings.tsx
│   │   └── ui/            # Shadcn UI components
│   ├── lib/               # Core logic and services
│   │   ├── gemini.ts      # Gemini AI service
│   │   ├── supabase.ts    # Supabase client
│   │   └── database.ts    # Database operations
│   ├── hooks/             # Custom React hooks
│   ├── styles/            # Global CSS
│   └── App.tsx            # Main application component
├── docs/                  # All documentation files
│   ├── SQL/               # SQL scripts
│   └── ...
└── .env.example           # Environment variable template
```

-----

## 🔍 Troubleshooting

A summary of common issues and their solutions.

| Issue | Solution |
| :--- | :--- |
| **"RLS Policy Error (42501)"** | Run the `/docs/SQL/FIX_RLS_POLICY.sql` script in your Supabase SQL Editor. |
| **"EmailJS 422 - Recipients address empty"** | Ensure your EmailJS template's "To email" field is set to `{{to_email}}`. |
| **"Gemini 503 - Model overloaded"** | This is a temporary error from the API. The app has auto-retry, but waiting a minute usually helps. |
| **"Messages not saving"** | Double-check your `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` in your `.env` file. |
| **"OTP not received"** | Check your spam folder. Verify all your EmailJS IDs and keys in the `.env` file are correct. |

> For more detailed guides, please see the files in the `/docs` directory.

-----

## 🚀 Future Roadmap

### Implemented ✅

  - [x] Gemini AI integration
  - [x] User authentication (OTP) & Guest Mode
  - [x] Supabase database & Conversation history
  - [x] File attachments & Voice input
  - [x] Dark/Light theme & Responsive design
  - [x] Admin panel with database-driven configuration (v2.0)
  - [x] No hardcoded API keys (v2.0)

### Future Enhancements 🚀

  - [ ] Multi-language support
  - [ ] Code syntax highlighting in responses
  - [ ] Export/Download conversations
  - [ ] Search conversation history
  - [ ] Conversation sharing

-----

## 👨‍💻 Author

This project was created as a personal portfolio piece and learning exercise.

  * **Abhijeet Krishna Budhak**
  * **Email:** abhibudhak@gmail.com
  * **Institution:** Ballarpur Institute of Technology (B.Tech CSE, 3rd Year)

## 🌟 Acknowledgments

  * **Google Gemini AI** - For the powerful AI model
  * **Supabase** - For their excellent open-source backend platform
  * **EmailJS** - For a simple and effective email-sending service
  * **Shadcn/ui** - For the fantastic component library

## 📄 License

<<<<<<< HEAD
This project is open-source and available under the [MIT License](https://www.google.com/search?q=LICENSE).
=======
This project is open-source and available under the [MIT License](https://www.google.com/search?q=LICENSE).
