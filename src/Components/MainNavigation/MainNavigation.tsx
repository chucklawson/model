import Tab from '../Tab/Tab'
import home from '../../srcImages/home.png'
import statistics from '../../srcImages/statistics.png'
//import clipboard from '../../srcImages/clipboard.png'
//import math from '../../srcImages/math.ico'
//import banks from '../../srcImages/bank.png'
//import robot from '../../srcImages/robot.png'
//import budget from '../../srcImages/budget.png'

function MainNavigation(){

  return(
    <header>
      <div className="bg-gray-100 px-1 py-0.5 h-12">
        <nav >
          <ul className='flex'>
            {/* this grouping builds menu items from the left to right on the left side of screen */}
            <div className="left md:w-3/4 sm:w-1/3 flex">
              <Tab pagePath='/' tabImage = {home} tabText='Home' tabWidth='125px'/>
              <Tab pagePath='/current' tabImage = {statistics} tabText='Current' tabWidth='135px'/>
              <Tab pagePath='/dividendentries' tabImage = {statistics} tabText='Div Entries' tabWidth='190px'/>
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