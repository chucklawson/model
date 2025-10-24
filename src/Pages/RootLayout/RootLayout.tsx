import { Outlet } from "react-router-dom";
import MainNavigation from "../../Components/MainNavigation/MainNavigation";

function RootLayout(){

    return(
        <>
            <MainNavigation/>
            <Outlet />
        </>
    );
}
export default RootLayout;