import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './Pages/RootLayout/RootLayout'

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import HomePage from './Pages/HomePage/HomePage';
import HistoricalDividends from "./Pages/HistoricalDividends/HistoricalDividends";
import Tickers from "./Pages/Tickers/Tickers";
import FlexiblePortfolio from "./Pages/FlexiblePortfolio/FlexiblePortfolio";
import Research from "./Pages/Research/Research";
import KeyMetrics from "./Pages/KeyMetrics/KeyMetrics";
import Calculators from "./Pages/Calculators/Calculators";
import SettingsPage from "./Pages/Settings/Settings";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary";

function App() {


  return (
    <Authenticator>
      {({ signOut }) => {
        const router = createBrowserRouter([
          {
            path: '/',
            element: <RootLayout signOut={signOut} />,
            children: [
              {path: '/', element: <HomePage/>},
              {path: '/tickers', element: <Tickers/>},
              {path: '/portfolio', element: <FlexiblePortfolio/>},
              {path: '/research', element: <Research/>},
              {path: '/keymetrics', element: <KeyMetrics/>},
              {path: '/calculators', element: <Calculators/>},
              {path: '/historicaldividendentries', element: <HistoricalDividends/>},
              {path: '/settings', element: <SettingsPage/>},
            ]
          },
        ]);

        return (
          <ErrorBoundary>
            <div className="App">
              <RouterProvider router={router}/>
            </div>
          </ErrorBoundary>
        );
      }}
    </Authenticator>
  );
}

export default App
