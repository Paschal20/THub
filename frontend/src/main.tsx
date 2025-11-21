// main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store, persistor } from "./app/store";
import { PersistGate } from "redux-persist/integration/react";
import "animate.css";
import { ActiveSectionProvider } from "./app/pages/LandingPage/ActiveSection.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ActiveSectionProvider>
            <App />
          </ActiveSectionProvider>
        </PersistGate>
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
