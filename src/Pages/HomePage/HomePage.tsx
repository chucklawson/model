

import {useEffect,useState} from "react";
import reactLogo from "../../../src/assets/react.svg";
import viteLogo from '../../../public/vite.svg'
import '../../App.css'

function HomePage(){
    //const [headerValue,setHeaderValue] = useState('Howdy !')
    const headerValue = 'Howdy !';
    useEffect(() => {
        document.title = "Home"
     }, []);

  const [count, setCount] = useState(0)

    //setHeaderValue('Howdy !');

return(
    <>
      <div className="text-center">
        <header className="bg-green-100 text-green-600 text-3xl font-bold h-20 justify-items-center p-5">
          <div>
            {headerValue}
          </div>
        </header>
      </div>

      <>
        <div className="images">
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo"/>
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo"/>
          </a>
        </div>

        <h1 className='text-red-500'>Vite + React</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </>


    </>
)
}
export default HomePage;