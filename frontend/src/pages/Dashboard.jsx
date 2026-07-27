import Navbar from "../components/Navbar";
import ChatBox from "../components/ChatBox";

import "./Dashboard.css";

function Dashboard() {

  return (

    <>

      <Navbar/>

      <div className="dashboard">

        <div className="card-grid">

        </div>

        <ChatBox/>

      </div>

    </>

  );

}

export default Dashboard;