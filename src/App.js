import React from "react";
import WeatherService from "./component/WeatherService";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<WeatherService />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
