import Dashboard from "./pages/dashboard/Dashboard";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ImageGallery from "./pages/dashboard/ImageGallery";
import Events from "./pages/dashboard/Events";
import Clubs from "./pages/dashboard/Clubs";
import { BreadcrumbProvider } from "./contexts/BreadcrumbContext";
import FacultyGallery from "./pages/dashboard/FacultyGallery";
import PlacementGallery from "./pages/dashboard/PlacementData";
import Research from "./pages/dashboard/Research";
import AwardGallery from "./pages/dashboard/AwardGallery";
function App() {
  return (
    <BreadcrumbProvider>
      <Router>
        <Dashboard>
          <Routes>
            <Route path="/" element={<ImageGallery />} />
            <Route path="/research" element={<Research />} />
            <Route path="/events" element={<Events />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/faculty" element={<FacultyGallery />} />
            <Route path="/placements" element={<PlacementGallery />} />
            <Route path="/award" element={<AwardGallery />} />
          </Routes>
        </Dashboard>
      </Router>
    </BreadcrumbProvider>
  );
}

export default App;
