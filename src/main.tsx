import { StrictMode } from 'react'

import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";


console.log('Outputs:', outputs);
console.log('About to configure Amplify');
Amplify.configure(outputs);
console.log('Configured Amplify');


import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './utils/devTools';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
