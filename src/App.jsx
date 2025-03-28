import Dashboard from "./pages/dashboard/Dashboard";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ImageGallery from "./pages/dashboard/ImageGallery";
import Events from "./pages/dashboard/Events";
import { BreadcrumbProvider } from "./contexts/BreadcrumbContext";

function App() {
  return (
    <BreadcrumbProvider>
      <Router>
        <Dashboard>
          <Routes>
            <Route path="/" element={<ImageGallery />} />
            <Route path="/events" element={<Events />} />
          </Routes>
        </Dashboard>
      </Router>
    </BreadcrumbProvider>
  );
}

export default App;
