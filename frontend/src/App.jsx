import { BrowserRouter } from "react-router-dom";

import { ToastProvider } from "./contexts/ToastContext";
import PageTitle from "./routes/PageTitle";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <PageTitle />
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;