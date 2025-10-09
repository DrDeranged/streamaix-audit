import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker, setupPWAInstallPrompt } from "./utils/pwa";

// Register service worker for PWA
registerServiceWorker();

// Setup PWA install prompt
setupPWAInstallPrompt();

createRoot(document.getElementById("root")!).render(<App />);
