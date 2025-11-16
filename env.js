/*
  ==============================================================================
  === DANGER ZONE: Gemini API Key Configuration for Local Development          ===
  ==============================================================================
  
  This file is for setting your Gemini API key when running the application
  locally in an environment like VS Code where system environment variables
  might not be easily accessible to the browser.

  --- INSTRUCTIONS ---
  1.  Obtain your API key from Google AI Studio.
  2.  Replace the placeholder text 'PASTE_YOUR_GEMINI_API_KEY_HERE' below with
      your actual key.
  3.  SAVE this file.

  --- SECURITY WARNING ---
  ->  NEVER commit this file with your API key to a public or private
      repository (like GitHub). This file should be listed in your .gitignore
      file to prevent accidental exposure of your credentials.
  ->  For production deployments, use a secure method for managing API keys,
      such as server-side environment variables or a dedicated secrets
      management service.

  ==============================================================================
*/

// Polyfill process.env if it doesn't exist on the window object
if (typeof window.process === 'undefined') {
  window.process = {};
}
if (typeof window.process.env === 'undefined') {
  window.process.env = {};
}

// !! PASTE YOUR KEY ON THE NEXT LINE !!
window.process.env.API_KEY = 'PASTE_YOUR_GEMINI_API_KEY_HERE';
