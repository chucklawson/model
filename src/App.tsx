import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './Pages/RootLayout/RootLayout'

import { Authenticator } from '@aws-amplify/ui-react';
import HomePage from './Pages/HomePage/HomePage';
import CurrentHoldings from './Pages/CurrentHoldings/CurrentHoldings';


const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {path: '/', element: <HomePage/>},
      {path: '/current', element: <CurrentHoldings/>},
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
