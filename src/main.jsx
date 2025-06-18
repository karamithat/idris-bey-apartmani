import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ApartmentManagement from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ApartmentManagement />
  </StrictMode>
);
