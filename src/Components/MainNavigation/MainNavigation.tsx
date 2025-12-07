import Tab from '../Tab/Tab'
import home from '../../Images/home.png'
import statistics from '../../Images/statistics.png'
import clipboard from '../../Images/clipboard.png'
//import math from '../../Images/math.ico'
import banks from '../../Images/bank.png'
import robot from '../../Images/robot.png'
import budget from '../../Images/budget.png'


function MainNavigation(){

  return(
    <header>
      <div className="bg-gray-100 px-1 py-0.5 h-12 overflow-x-auto">
        <nav>
          <ul className='flex flex-nowrap'>
            {/* this grouping builds menu items from the left to right on the left side of screen */}
            <div className="left flex flex-shrink-0">
              <Tab pagePath='/' tabImage = {home} tabText='Home' tabWidth='125px'/>
              <Tab pagePath='/tickers' tabImage = {robot} tabText='Tickers' tabWidth='135px'/>
              <Tab pagePath='/current' tabImage = {statistics} tabText='Current' tabWidth='135px'/>
              <Tab pagePath='/dividendentries' tabImage = {statistics} tabText='Div Entries' tabWidth='190px'/>
              <Tab pagePath='/banks' tabImage = {banks} tabText='Financial' tabWidth='150px'/>
              <Tab pagePath='/watchlist' tabImage = {budget} tabText='Watchlist' tabWidth='185px'/>
              <Tab pagePath='/research' tabImage = {clipboard} tabText='News' tabWidth='165px'/>
              <Tab pagePath='/statmententries' tabImage = {budget} tabText='Statements' tabWidth='185px'/>
              <Tab pagePath='/historicaldividendentries' tabImage = {budget} tabText='Dividends' tabWidth='185px'/>
              {/*
              <Tab pagePath='/summaryentries' tabImage = {robot} tabText='Summary' tabWidth='185px'/>
              */}

            </div>


            {/* This works to move menu items over to the right side.
        <div className="right md:w-1/4 sm:w-2/3 flex ">
            <Tab pagePath='/' tabImage = {home} tabText='Right' tabWidth='150px'/>
            <NavLink to='/current'> Current </NavLink>
            <NavLink to='/current'> Current </NavLink>
        </div>
        */}
          </ul>
        </nav>
      </div>
    </header>
  );

}
export default MainNavigation;