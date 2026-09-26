import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CashbackStoreProvider } from "./store/CashbackStoreProvider";

const updateSW = registerSW({
  onNeedRefresh() {
    toast.info("Доступно обновление приложения", {
      description: "Нажмите «Обновить», чтобы загрузить свежую версию",
      action: {
        label: "Обновить",
        onClick: () => updateSW(true),
      },
      duration: 15000,
      id: "pwa-update-available",
    });
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
