import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { StrictMode } from "react";

// Add these styles to the head
const styleElement = document.createElement('style');
styleElement.textContent = `
  :root {
    --primary: 210 79% 46%;
    --primary-foreground: 0 0% 100%;
    
    --secondary: 122 41% 49%;
    --secondary-foreground: 0 0% 100%;
    
    --accent: 14 100% 57%;
    --accent-foreground: 0 0% 100%;
    
    --destructive: 4 90% 58%;
    --destructive-foreground: 0 0% 100%;
    
    --background: 220 16% 96%;
    --foreground: 210 29% 24%;
    
    --muted: 210 29% 24% / 0.6;
    --muted-foreground: 210 29% 24% / 0.6;
    
    --card: 0 0% 100%;
    --card-foreground: 210 29% 24%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 210 29% 24%;
    
    --input: 0 0% 90%;
    --border: 0 0% 90%;
    --ring: 210 79% 46%;
    
    --radius: 0.5rem;
  }
`;
document.head.appendChild(styleElement);

// Add the Inter and Source Sans Pro fonts
const linkElement = document.createElement('link');
linkElement.rel = 'stylesheet';
linkElement.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&display=swap';
document.head.appendChild(linkElement);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
