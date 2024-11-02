import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DataSourceSelection from "./pages/DataSourceSelection";
import PatternDefinition from "./pages/PatternDefinition";
import MLModelConfig from "./pages/MLModelConfig";
import Visualization from "./pages/Visualization";
import Settings from "./pages/Settings";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/data-source" element={<DataSourceSelection />} />
        <Route path="/pattern-definition" element={<PatternDefinition />} />
        <Route path="/model-config" element={<MLModelConfig />} />
        <Route path="/visualization" element={<Visualization />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
