import Dashboard from "./pages/dashboard/Dashboard";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ImageGallery from "./pages/dashboard/ImageGallery";
function App() {
  return (
    <Router>
      <Dashboard>
        <Routes>
          <Route path="/" element={<ImageGallery />} />
        </Routes>
      </Dashboard>
    </Router>
  );
}

export default App;
