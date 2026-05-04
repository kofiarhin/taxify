import { BrowserRouter } from "react-router-dom";
import { Providers } from "./redux/providers";
import { AppRouter } from "./routes/AppRouter";

// main app
function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </Providers>
  );
}

export default App;
