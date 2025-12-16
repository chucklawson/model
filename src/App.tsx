import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './Pages/RootLayout/RootLayout'

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import HomePage from './Pages/HomePage/HomePage';
// Removed page imports (pages still exist in repo):
// import CurrentHoldings from './Pages/CurrentHoldings/CurrentHoldings';
// import DividendEntries from "./Pages/DividendEntries/DividendEntries";
// import Banks from "./Pages/Banks/Banks";
// import WatchList from "./Pages/WatchList/WatchList.tsx";
import HistoricalDividends from "./Pages/HistoricalDividends/HistoricalDividends";
import Tickers from "./Pages/Tickers/Tickers";
import FlexiblePortfolio from "./Pages/FlexiblePortfolio/FlexiblePortfolio";
import Research from "./Pages/Research/Research";
import KeyMetrics from "./Pages/KeyMetrics/KeyMetrics";
import Calculators from "./Pages/Calculators/Calculators";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary";
//import SummarySpreadSheet from "./Pages/SummarySpreadSheet/SummarySpreadSheet";


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
              // Removed tabs (pages still exist in repo): Current, Div Entries, Financial, Watchlist
              // {path: '/current', element: <CurrentHoldings/>},
              // {path: '/dividendentries', element: <DividendEntries/>},
              // {path: '/banks', element: <Banks/>},
              // {path: '/watchlist', element: <WatchList/>},
              {path: '/research', element: <Research/>},
              {path: '/keymetrics', element: <KeyMetrics/>},
              {path: '/calculators', element: <Calculators/>},
              {path: '/historicaldividendentries', element: <HistoricalDividends/>},
              {/*}
              {path: '/summaryentries', element: <SummarySpreadSheet/>},
              */}
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
