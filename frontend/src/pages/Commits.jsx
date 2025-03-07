import { signOut } from "firebase/auth";
import "../assets/style/Commits.css";
import { auth } from "../firebase";
import { Navigate } from "react-router-dom";
import ContributionChart from "../components/contributionChart"; // Import the chart component

export const Commits = ({ user }) => {
    if (!user) {
        return <Navigate to="/login" />;
    }

    const handleSignOut = () => {
        signOut(auth)
            .then(() => console.log("Sign Out successful"))
            .catch((error) => console.log("Sign Out error:", error));
    };

    const commitWeeks = Array.from({ length: 52 });
    const currentMonth = new Date().getMonth(); // Get the current month (0-11)

    const daysInCurrentMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate();
    
    return (
        <div className="main">
            <div className="user-greeting">
                <div className="welcome">
                    <h2>welcome,</h2>
                    <h2 className="name">pranav.</h2>
                </div>
                <div className="day">
                    2025/03/09
                </div>
                <div className="time">
                    18:09pm
                </div>
                <div className="profile">
                    <img src="/IMG_3813.jpg" alt="" className='profile-pic'/>
                </div>
            </div>
            

            <div className="commits">
                <p>march, 2025</p>
                <div className="commit-box">
                    {commitWeeks.map((_, weekIndex) => (
                        <div key={weekIndex} className="commit-week">
                            {Array.from({ length: 7 }).map((_, commitIndex) => {
                                const dayIndex = weekIndex * 7 + commitIndex;
                                const isGlowing = dayIndex < daysInCurrentMonth;
                                return (
                                    <div key={commitIndex} className={`commit ${isGlowing ? 'glowing' : ''}`}></div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>


            <div className="interaction">
                <div className="recent-commits">
                    <p><u>recent commits</u></p>
                    <div className="recent-box">

                    </div>
                </div>

                <div className="leaderboard">
                    <p className="leaderboard-title"><u>leaderboard</u></p>
                    <div className="leaderboard-box">

                    </div>
                </div>
            </div>

            <div className="committer">
                <p>commit</p>
                <input type="text" className="commit-input" placeholder="Record results"/>
            </div>
                
            <button onClick={handleSignOut}>Sign Out</button>
        </div>
    );
};