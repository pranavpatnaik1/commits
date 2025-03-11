import { signOut } from "firebase/auth";
import "../assets/style/Commits.css";
import { auth } from "../firebase";
import { Navigate } from "react-router-dom";
import { getFirestore, doc, updateDoc, arrayUnion, setDoc, getDoc, increment, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import React, { useState, useEffect, useRef } from "react";
import { storage } from "../firebase";
import { ref, getDownloadURL } from "firebase/storage";

const db = getFirestore();

export const Commits = ({ user }) => {
    const [commitText, setCommitText] = useState("");
    const [recentCommits, setRecentCommits] = useState([]);
    const [currentDate, setCurrentDate] = useState("");
    const [commitCounts, setCommitCounts] = useState({});
    const [currentTime, setCurrentTime] = useState("");
    const [userData, setUserData] = useState(null);
    const [friendUsername, setFriendUsername] = useState("");
    const [profilePic, setProfilePic] = useState('/blue default pfp.png');

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.uid) {
                const userRef = doc(db, "users", user.uid);
                try {
                    const docSnap = await getDoc(userRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);

                        // If user has a pfp URL in their data, use it directly
                        if (data.pfp) {
                            setProfilePic(data.pfp);
                            console.log("Using stored pfp URL:", data.pfp);
                        } else {
                            // No profile picture set, use default
                            console.log("No profile picture found, using default");
                            setProfilePic('/blue default pfp.png');
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setProfilePic('/blue default pfp.png');
                }
            }
        };
        
        fetchUserData();
    }, [user]);

    const firstName = userData?.name ? userData.name.split(' ')[0].toLowerCase() : '';

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
          if (!event.target.matches('.profile-pic, .profile-pic *, .friends, .friends *, .settings, .settings *')) {
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

    useEffect(() => {
        const closeDropdowns = (event) => {
            const dropdown = document.getElementById("dropdownMenu");
            const friendsMenu = document.getElementById("friendsMenu");
            const overlay = document.getElementById("overlay");

            if (!event.target.closest('.profile-pic') && !event.target.closest('.friends') && !event.target.closest('.settings') && !event.target.closest('.dropdown-content') && !event.target.closest('.friends-content')) {
                if (dropdown && dropdown.style.display === "block") {
                    dropdown.style.display = "none";
                }
                if (friendsMenu && friendsMenu.style.display === "block") {
                    friendsMenu.style.display = "none";
                    overlay.style.display = "none";
                }
            }
        };

        document.addEventListener('mousedown', closeDropdowns);
        return () => {
            document.removeEventListener('mousedown', closeDropdowns);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const friendsMenu = document.getElementById("friendsMenu");
            const overlay = document.getElementById("overlay");
            const friendsButton = event.target.closest('.friends');

            // If clicking outside the friends menu and not on the friends button
            if (!friendsButton && !event.target.closest('.friends-content')) {
                if (friendsMenu && overlay) {
                    friendsMenu.style.display = "none";
                    overlay.style.display = "none";
                }
                if (friendsMenu) {
                    friendsMenu.style.display = "none";
                }
                if (overlay) {
                    overlay.style.display = "none";
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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
        const formattedTime = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', timeZone: "America/New_York" });

        try {
            await updateDoc(userRef, {
                commits_master: arrayUnion({
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
        const userRef = doc(db, "users", user.uid);
        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.commits_master) {
                    // Convert to array if it's not already one
                    const commits = Array.isArray(userData.commits_master) 
                        ? userData.commits_master 
                        : Object.values(userData.commits_master);
                    setRecentCommits(commits);
                } else {
                    setRecentCommits([]); // Initialize as empty array if no commits exist
                }
                if (userData.commitCounts) {
                    setCommitCounts(userData.commitCounts);
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
    const redHue = Math.max(20, 217 - commitsToday * 30);
    const greenHue = Math.max(120, 217 - commitsToday * 15);
    const commitColor = `rgb(${redHue}, ${greenHue}, 225)`;

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

      const toggleFriends = (e) => {
        e.stopPropagation(); // Prevent event from bubbling up
        const dropdown = document.getElementById("friendsMenu");
        const overlay = document.getElementById("overlay");
        if (dropdown) {
            const isVisible = dropdown.style.display === "block";
            dropdown.style.display = isVisible ? "none" : "block";
            overlay.style.display = isVisible ? "none" : "block";
        }

        toggleDropdown();
      };

      const handleFriendRequest = async (e) => {
        e.preventDefault();
        if (!friendUsername.trim()) return;
    
        // Remove @ symbol if present
        const cleanUsername = friendUsername.replace('@', '');
        
        try {
            // 1. Query all users to find the target user
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", cleanUsername));
            const querySnapshot = await getDocs(q);
    
            if (querySnapshot.empty) {
                console.log("User not found");
                return;
            }
    
            // 2. Get the target user's document
            const targetUserDoc = querySnapshot.docs[0];
            
            // 3. Update both users' requests lists
            const batch = writeBatch(db);
    
            // Update current user's pending_requests
            const currentUserRef = doc(db, "users", user.uid);
            batch.update(currentUserRef, {
                "requests.pending_requests": arrayUnion(cleanUsername)
            });
    
            // Update target user's incoming_requests
            batch.update(targetUserDoc.ref, {
                "requests.incoming_requests": arrayUnion(userData.username)
            });
    
            // Commit both updates
            await batch.commit();
    
            console.log("Friend request sent successfully");
            setFriendUsername(""); // Clear input after sending
        } catch (error) {
            console.error("Error sending friend request:", error);
        }
    };


      
    
    return (
        <div className="main">
            <div className="user-greeting">
                <div className="welcome">
                    <h2>welcome,</h2>
                    <h2 className="name">{firstName}</h2>
                </div>
                <div className="day">
                    {currentDate}
                </div>
                <div className="time">
                    {currentTime}
                </div>
                <div className="profile">
                    <img src={profilePic} alt="" className='profile-pic' onClick={toggleDropdown}/>
                    <div className="dropdown-content" id="dropdownMenu">
                        <h2 className="user-official-name">Pranav Patnaik</h2>
                        <p className="username">@pranavpatnaik_</p>
                        <p className="commit-number">{commitsToday} commits</p>
                        <hr />
                        <div className="admin">
                            <button className="log-out" onClick={handleSignOut}>Sign Out</button>
                            <img src="add friends.png" alt="friends" className="friends" onClick={toggleFriends}/>
                            
                            <img src="settings.png" alt="settings" className="settings"/>
                            
                        </div>
                    </div>
                    <div id="overlay" className="overlay"></div>
                    <div className="friends-content" id="friendsMenu">
                        <div className="friends-content-top">
                            <p className="friends-title"><span className="underline-animation">friends</span></p>
                            <div className="all-or-pending">
                                <button>All</button>
                                <p className="divider">|</p>
                                <button>Pending</button>
                            </div>
                        </div>
                        <div className="friends-list">
                            <div className="friend-profile">
                                <img src="/IMG_3813.jpg" alt="" className="friend-pic"/>
                                <div>
                                    <p className="friend-name">Pranav Patnaik <span className="friend-username">(@pranavpatnaik_)</span></p>
                                    <p className="friend-commits">3 commits</p>
                                </div>
                            </div>
                            <div className="friend-profile">
                                <img src="/IMG_3813.jpg" alt="" className="friend-pic"/>
                                <div>
                                    <p className="friend-name">Pranav Patnaik <span className="friend-username">(@pranavpatnaik_)</span></p>
                                    <p className="friend-commits">3 commits</p>
                                </div>
                            </div>
                            <div className="friend-profile">
                                <img src="/IMG_3813.jpg" alt="" className="friend-pic"/>
                                <div>
                                    <p className="friend-name">Pranav Patnaik <span className="friend-username">(@pranavpatnaik_)</span></p>
                                    <p className="friend-commits">3 commits</p>
                                </div>
                            </div>
                            <div className="friend-profile">
                                <img src="/IMG_3813.jpg" alt="" className="friend-pic"/>
                                <div>
                                    <p className="friend-name">Pranav Patnaik <span className="friend-username">(@pranavpatnaik_)</span></p>
                                    <p className="friend-commits">3 commits</p>
                                </div>
                            </div>
                            <div className="friend-profile">
                                <img src="/IMG_3813.jpg" alt="" className="friend-pic"/>
                                <div>
                                    <p className="friend-name">Pranav Patnaik <span className="friend-username">(@pranavpatnaik_)</span></p>
                                    <p className="friend-commits">3 commits</p>
                                </div>
                            </div>
                            <div className="friend-profile">
                                <img src="/IMG_3813.jpg" alt="" className="friend-pic"/>
                                <div>
                                    <p className="friend-name">Pranav Patnaik <span className="friend-username">(@pranavpatnaik_)</span></p>
                                    <p className="friend-commits">3 commits</p>
                                </div>
                            </div>
                        </div>
                        <div className="invite-friends">
                            <form onSubmit={handleFriendRequest}>
                                <input 
                                    type="text" 
                                    className="friend-input" 
                                    placeholder="Invite friends (@username)" 
                                    value={friendUsername}
                                    onChange={(e) => setFriendUsername(e.target.value)}
                                />
                            </form>
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