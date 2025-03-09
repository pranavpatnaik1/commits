import { signOut } from "firebase/auth";
import "../assets/style/Commits.css";
import { auth } from "../firebase";
import { Navigate } from "react-router-dom";
import { getFirestore, doc, updateDoc, arrayUnion, setDoc, getDoc, increment } from "firebase/firestore";
import React, { useState, useEffect, useRef } from "react";

const db = getFirestore();

export const Commits = ({ user }) => {
    const [commitText, setCommitText] = useState("");
    const [recentCommits, setRecentCommits] = useState([]);
    const [currentDate, setCurrentDate] = useState("");
    const [commitCounts, setCommitCounts] = useState({});
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

    useEffect(() => {
        fetchCommits();
    }, [user]);

    useEffect(() => {
        // Close the dropdown if the user clicks outside
        const closeDropdown = (event) => {
          if (!event.target.matches('.profile-pic, .profile-pic *')) {
            const dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) {
              const openDropdown = dropdowns[i];
              if (openDropdown.style.display === "block") {
                openDropdown.style.display = "none";
              }
            }
          }
        };
      
        // Add event listener to close dropdown
        window.addEventListener('click', closeDropdown);
      
        // Cleanup the event listener when the component unmounts
        return () => {
          window.removeEventListener('click', closeDropdown);
        };
      }, []);  // Empty dependency array means this effect runs only once, on mount

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
        const formattedTime = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', timeZone: "America/New_York" });

        try {
            await updateDoc(userRef, {
                commits: arrayUnion({
                        date: formattedDate,
                        text: commitText,
                        timestamp: formattedTime, // Store the current time as ISO string
                }),
                [`commitCounts.${formattedDate}`]: increment(1),
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
                if (userData.commitCounts) {
                    setCommitCounts(userData.commitCounts); // Store commit counts
                }
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error getting document:", error);
        }
    };

    const now = new Date();
    const dayOfMonth = now.getDate();
    const dayIndex = dayOfMonth - 1;  // Zero-based index

    // Get the corresponding week and commit position in the grid
    const commitWeeks = Array.from({ length: 52 });
    const daysInCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    const countCommitsForToday = () => {
        return recentCommits.filter(commit => commit.date === currentDate).length;
    };

    const commitsToday = countCommitsForToday();
    const commitHue = (commitsToday * 20) % 256;
    const redHue = Math.max(20, 217 - commitsToday * 20);
    const greenHue = Math.max(120, 217 - commitsToday * 20);
    const commitColor = `rgb(${redHue}, ${greenHue}, 200)`;

    // Now, you can target the specific square by determining the row (week) and column (day)
    const targetWeek = Math.floor(dayIndex / 7);  // Which week the square falls in
    const targetDay = dayIndex % 7;  // Which day in the week it is

    const targetSquareRef = useRef(null);

    const formattedDate = now.toISOString().split("T")[0]; // "YYYY-MM-DD"

    console.log("Current Date:", currentDate);
    console.log("Formatted Date:", formattedDate);
    console.log("Commits Today:", commitsToday);
    console.log("Commit Color:", commitColor);
      
      const toggleDropdown = () => {
        const dropdown = document.getElementById("dropdownMenu");
        dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
      };
      
    
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
                    <img src="/IMG_3813.jpg" alt="" className='profile-pic' onClick={toggleDropdown}/>
                    <div className="dropdown-content" id="dropdownMenu">
                        <h2 className="user-official-name">Pranav Patnaik</h2>
                        <p className="username">@pranavpatnaik_</p>
                        <p className="commit-number">{commitsToday} commits</p>
                        <hr />
                        <div className="admin">
                            
                            <button className="log-out" onClick={handleSignOut}>Sign Out</button>
                            <img src="add friends.png" alt="friends" className="friends"/>
                            <img src="settings.png" alt="settings" className="settings"/>
                            
                        </div>
                    </div>
                </div>
            </div>
            

            <div className="commits">
                <p>march, 2025</p>
                <div className="commit-box">
                    {commitWeeks.map((_, weekIndex) => (
                        <div key={weekIndex} className="commit-week">
                        {Array.from({ length: 7 }).map((_, commitIndex) => {
                            const squareIndex = weekIndex * 7 + commitIndex;
                            const isToday = squareIndex === dayIndex; // Check if this is today's square
                            const isBeforeToday = squareIndex < dayIndex;

                            return (
                                <div 
                                    key={commitIndex} 
                                    ref={isToday ? targetSquareRef : null} // Only assign ref to today's square
                                    className={`commit ${isToday ? 'glowing' : ''} ${isBeforeToday ? 'dimmed' : ''}`}
                                    style={{ backgroundColor: isToday ? commitColor : '' }}
                                />
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
                            recentCommits.map((commit, index) => {
                                // Check if commit.date matches the formattedDate
                                const commitDate = commit.date; // Assuming commit.date is in "YYYY-MM-DD" format
                                if (commitDate === formattedDate) {
                                    return (
                                        <div key={index} className="commit-entry">
                                            <p className="commit-name">{commit.text}</p>
                                            <span className="commit-time">{commit.timestamp}</span>
                                        </div>
                                    );
                                }
                                return; // Skip commits not matching the date
                            })
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
        </div>
    );
};