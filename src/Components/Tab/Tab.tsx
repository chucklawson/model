import { NavLink} from 'react-router-dom'

interface TabData{
  pagePath:string,
    tabImage:string,
    tabText:string,
    tabWidth:string,
}

//const Tab = props => {
//<img src={props.tabImage} className="inline-block w-7 h-7 p-1 mx-2 my-1" alt=""></img>

const Tab = (props:TabData) => {
    //console.log('props.pagePath: ' + props.pagePath)
  return (

        <li className='font-bold' style={{ width: props.tabWidth}}>
                <NavLink to= {props.pagePath} style={({ isActive }) => ( 
                    { color: isActive ? 'Coral': 'DimGrey' } )}>


                <div className='bg-gray-100 mx-2 p-1 rounded-md hover:text-black
                                    transition ease-in-out delay-150 hover:-translate-y-1
                                    hover:scale-110 hover:bg-green-200 duration-300'>

                  <img src={props.tabImage} className="inline-block w-7 h-7 p-1 mx-2 my-1" alt=""></img>
                
                <span className='inline-block'>{props.tabText}</span>
                
                </div>   
                </NavLink>
        </li>
    );
}
export default Tab;