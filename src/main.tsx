import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CashbackStoreProvider } from "./store/CashbackStoreProvider";
import { showPwaUpdateToast } from "./utils/pwaToast";

const updateSW = registerSW({
  onNeedRefresh() {
    showPwaUpdateToast(() => updateSW(true));
  },
  onOfflineReady() {
    // Приложение готово к оффлайн-работе
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <CashbackStoreProvider>
        <App />
      </CashbackStoreProvider>
    </ErrorBoundary>
  </StrictMode>,
);
