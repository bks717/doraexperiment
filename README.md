# Gemini Geo Explorer

An interactive world map powered by the Google Gemini API, nicknamed "Dora the Explorer". Explore locations, get AI-analyzed driving directions, and ask complex geographical questions in a beautiful and intuitive interface.

![Gemini Geo Explorer Screenshot](https://storage.googleapis.com/aistudio-ux-team-public/sdk_gallery/gemini-geo-explorer.png)

---
## ✨ Features

-   **📍 Find a Place**: Enter any city, landmark, or address and watch the globe animate and zoom to its precise location.
-   **🗺️ Area Highlighting**: For larger regions like countries or states, the AI generates and displays a boundary polygon.
-   **🚗 AI-Powered Directions**: Get multiple driving routes between two points, complete with distance, time, traffic analysis, and an AI-recommended best option.
-   **🧠 Knowledge Queries**: Ask complex questions like *"What is the population of Tokyo?"* or *"Tell me about the Eiffel Tower."* The AI will find the location, answer the question, and provide its reasoning.
-   **🖌️ Draw & Ask**: Draw your own custom polygon on the map and ask specific questions about that user-defined area.
-   **🔗 Live Analysis**: A "Chain of Thought" panel visualizes the AI's step-by-step reasoning process in real-time as it fetches coordinates, analyzes routes, or derives answers.
-   **📊 Data Visualization**: For queries involving quantifiable data (e.g., population over time), the app automatically generates and displays a bar chart.

---
## 🛠️ Tech Stack

-   **Frontend**: [React](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/)
-   **AI**: [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
-   **Mapping**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (via CDN for simplicity)
-   **Build Tool**: [Vite](https://vitejs.dev/)

---
## 🚀 Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

-   **Node.js**: Download and install from [nodejs.org](https://nodejs.org/). This is required to run the build server.
-   **Google Gemini API key**: Get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Setup

1.  **Download the project:**
    Ensure all project files are in a folder on your computer.

2.  **Install Dependencies:**
    Open your terminal or command prompt in the project folder and run:
    ```bash
    npm install
    ```

3.  **Configure your API Key:**
    Open the `env.js` file in your code editor.
    Replace `'PASTE_YOUR_GEMINI_API_KEY_HERE'` with your actual key.

    ```javascript
    // env.js
    window.process.env.API_KEY = 'AIzaSy...'; // Your actual key
    ```
    *Note: Do not commit `env.js` to GitHub if it contains your real key.*

4.  **Run the application:**
    In your terminal, run:
    ```bash
    npm run dev
    ```
    You should see a URL appear (e.g., `http://localhost:5173`). Open this URL in your browser to use the app.

---
## 🤖 How It Works

The application leverages the power of the Gemini API's structured output capabilities (JSON schema) to interpret natural language queries and return precise geographical data.

1.  **Input**: A user enters a query (e.g., "Route from NYC to Boston").
2.  **Processing**: The app sends this to Gemini with a specific instruction to return JSON data containing coordinates, route steps, or knowledge answers.
3.  **Visualization**: React components render this data onto the Leaflet map and the side panels.
