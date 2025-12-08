import { Outlet } from "react-router-dom";
import MainNavigation from "../../Components/MainNavigation/MainNavigation";

interface RootLayoutProps {
  signOut?: () => void;
}

function RootLayout({ signOut }: RootLayoutProps){

    return(
        <>
          <div className="bg-gray-100 h-18">
            <MainNavigation signOut={signOut}/>
          </div>
            <Outlet />
        </>
    );
}
export default RootLayout;