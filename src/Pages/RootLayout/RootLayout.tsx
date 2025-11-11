import { Outlet } from "react-router-dom";
import MainNavigation from "../../Components/MainNavigation/MainNavigation";

function RootLayout(){

    return(
        <>
          <div className="bg-gray-100 h-18">
            <MainNavigation/>
          </div>
            <Outlet />
        </>
    );
}
export default RootLayout;