import { signOut } from "firebase/auth";
import "../assets/style/Commits.css";
import { auth } from "../firebase";
import { Navigate } from "react-router-dom";
import { getFirestore, doc, updateDoc, arrayUnion, setDoc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";

const db = getFirestore();

export const Commits = ({ user }) => {
    const [commitText, setCommitText] = useState("");
    const [recentCommits, setRecentCommits] = useState([]);
    const [currentDate, setCurrentDate] = useState("");
    const [currentTime, setCurrentTime] = useState("");

    // Function to update the date and time
    const updateDateTime = () => {
        const now = new Date();
        const formattedDate = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // "HH:MM"
        
        setCurrentDate(formattedDate);
        setCurrentTime(formattedTime);
    };

    // Set interval to update time and date every second
    useEffect(() => {
        updateDateTime(); // Initialize with current time and date
        const interval = setInterval(updateDateTime, 1000); // Update every second

        // Cleanup the interval when the component unmounts
        return () => clearInterval(interval);
    }, []);

    // LOGIN DETAILS

    if (!user) {
        return <Navigate to="/login" />;
    }

    const handleSignOut = () => {
        signOut(auth)
            .then(() => console.log("Sign Out successful"))
            .catch((error) => console.log("Sign Out error:", error));
    };

    const handleCommit = async () => {
        if (!commitText.trim()) return; // Prevent empty commits

        const userRef = doc(db, "users", user.uid); // Reference to user's document
        const now = new Date();
        const formattedDate = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        try {
            await updateDoc(userRef, {
                commits: arrayUnion({
                        date: formattedDate,
                        text: commitText,
                        timestamp: formattedTime, // Store the current time as ISO string
                }),
            });
            console.log("Commit saved to Firestore");
            setCommitText(""); // Clear input after saving

            fetchCommits();
        } catch (error) {
            console.error("Error saving commit:", error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent form submission (if any)
            handleCommit(); // Trigger commit on Enter key press
        }
    };

    const fetchCommits = async () => {
        const userRef = doc(db, "users", user.uid); // Reference to user's document
        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.commits) {
                    setRecentCommits(userData.commits);
                }
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error getting document:", error);
        }
    };

    useEffect(() => {
        fetchCommits();
    }, [user]);

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
                    {currentDate}
                </div>
                <div className="time">
                    {currentTime}
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
                    <p className="recent-title"><u>recent commits</u></p>
                    <div className="recent-box">
                    {recentCommits.length > 0 ? (
                            recentCommits.map((commit, index) => (
                                <div key={index} className="commit-entry">
                                    <p className="commit-name">{commit.text}</p>
                                    <span className="commit-time">{commit.timestamp}</span>
                                </div>
                            ))
                        ) : (
                            <p>No commits yet!</p>
                        )}
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
                <input type="text" 
                className="commit-input" 
                placeholder="Record results"
                value={commitText}
                    onChange={(e) => setCommitText(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                
                {/* <button className="submit" onClick={handleCommit}>Submit</button> */}
            </div>
                
            <button onClick={handleSignOut}>Sign Out</button>
        </div>
    );
};