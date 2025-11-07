import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './Pages/RootLayout/RootLayout'

import { Authenticator } from '@aws-amplify/ui-react';
import HomePage from './Pages/HomePage/HomePage';
import CurrentHoldings from './Pages/CurrentHoldings/CurrentHoldings';
import DividendEntries from "./Pages/DividendEntries/DividendEntries";
import Banks from "./Pages/Banks/Banks";
import WatchList from "./Pages/Watchlist/Watchlist";


const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {path: '/', element: <HomePage/>},
      {path: '/current', element: <CurrentHoldings/>},
      {path: '/dividendentries', element: <DividendEntries/>},
      {path: '/banks', element: <Banks/>},
      {path: '/watchlist', element: <WatchList/>},
    ]
  },

]);
function App() {


  return (
    <Authenticator>
      {({ signOut }) => (
    <>


      <div className="App">
        <RouterProvider router={router}/>
        <button onClick={signOut}>Sign out</button>
      </div>

    </>
    )
      }
    </Authenticator>
  );
}

export default App
