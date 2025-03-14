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
    const [activeView, setActiveView] = useState('all');
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friendsList, setFriendsList] = useState([]);
    const [leaderboardView, setLeaderboardView] = useState('day'); // 'day', 'week', 'month', 'all'
    const [leaderboardData, setLeaderboardData] = useState([]);

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

    useEffect(() => {
        const fetchPendingRequests = async () => {
            if (!userData?.requests) {
                console.log("No requests data available");
                return;
            }
    
            const requests = [];
            
            try {
                // Fetch incoming requests
                const incomingPromises = (userData.requests.incoming_requests || []).map(async (username) => {
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where("username", "==", username));
                    const querySnapshot = await getDocs(q);
                    
                    if (!querySnapshot.empty) {
                        return {
                            ...querySnapshot.docs[0].data(),
                            requestType: 'incoming'
                        };
                    }
                    return null;
                });
    
                // Fetch outgoing/pending requests
                const outgoingPromises = (userData.requests.pending_requests || []).map(async (username) => {
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where("username", "==", username));
                    const querySnapshot = await getDocs(q);
                    
                    if (!querySnapshot.empty) {
                        return {
                            ...querySnapshot.docs[0].data(),
                            requestType: 'outgoing'
                        };
                    }
                    return null;
                });
    
                // Wait for all requests to complete and filter out any null results
                const results = await Promise.all([...incomingPromises, ...outgoingPromises]);
                const validResults = results.filter(result => result !== null);
    
                console.log("Fetched pending requests:", validResults);
                setPendingRequests(validResults);
            } catch (error) {
                console.error("Error fetching pending requests:", error);
            }
        };
    
        fetchPendingRequests();
    }, [userData]);

    useEffect(() => {
        const fetchFriends = async () => {
            if (!userData?.friends) {
                console.log("No friends data available");
                return;
            }
    
            try {
                const friendsPromises = userData.friends.map(async (username) => {
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where("username", "==", username));
                    const querySnapshot = await getDocs(q);
                    
                    if (!querySnapshot.empty) {
                        return querySnapshot.docs[0].data();
                    }
                    return null;
                });
    
                const results = await Promise.all(friendsPromises);
                const validFriends = results.filter(friend => friend !== null);
                setFriendsList(validFriends);
            } catch (error) {
                console.error("Error fetching friends:", error);
            }
        };
    
        fetchFriends();
    }, [userData]);

    // Add this useEffect near your other useEffects
    useEffect(() => {
        const resetDailyCounts = async () => {
            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            // Only reset if last reset was yesterday or earlier
            if (userData?.lastReset !== yesterdayStr) {
                const userRef = doc(db, "users", user.uid);
                try {
                    await updateDoc(userRef, {
                        dailyCommits: 0,
                        lastReset: now.toISOString().split('T')[0]
                    });
                } catch (error) {
                    console.error("Error resetting daily counts:", error);
                }
            }
        };

        resetDailyCounts();
    }, [userData?.lastReset, user.uid]);

    useEffect(() => {
        const resetPeriodicalCounts = async () => {
            const now = new Date();
            const userRef = doc(db, "users", user.uid);

            try {
                // Check if we need to reset weekly counts
                if (now.getDay() === 0 && userData?.lastWeeklyReset !== now.toISOString().split('T')[0]) {
                    await updateDoc(userRef, {
                        weeklyCommits: 0,
                        lastWeeklyReset: now.toISOString().split('T')[0]
                    });
                }

                // Check if we need to reset monthly counts
                if (now.getDate() === 1 && userData?.lastMonthlyReset !== now.toISOString().split('T')[0]) {
                    await updateDoc(userRef, {
                        monthlyCommits: 0,
                        lastMonthlyReset: now.toISOString().split('T')[0]
                    });
                }
            } catch (error) {
                console.error("Error resetting periodical counts:", error);
            }
        };

        resetPeriodicalCounts();
    }, [userData, user.uid]);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                // Get all friends' data including current user
                const usersRef = collection(db, "users");
                let usernames = [...(userData?.friends || [])];
                
                // Always include current user
                if (userData?.username) {
                    usernames.push(userData.username);
                }

                if (usernames.length === 0) return;

                // Get fresh data for all users
                const q = query(usersRef, where("username", "in", usernames));
                const querySnapshot = await getDocs(q);
                
                // Get today's date for filtering daily commits
                const today = new Date().toISOString().split('T')[0];
                
                const results = querySnapshot.docs.map(doc => {
                    const userData = doc.data();
                    // Calculate daily commits from commitCounts if viewing by day
                    if (leaderboardView === 'day') {
                        const todayCommits = userData.commitCounts?.[today] || 0;
                        return {
                            ...userData,
                            dailyCommits: todayCommits
                        };
                    }
                    return userData;
                });

                // Sort based on selected view
                const sortedResults = results.sort((a, b) => {
                    switch(leaderboardView) {
                        case 'day':
                            return (b.dailyCommits || 0) - (a.dailyCommits || 0);
                        case 'week':
                            return (b.weeklyCommits || 0) - (a.weeklyCommits || 0);
                        case 'month':
                            return (b.monthlyCommits || 0) - (a.monthlyCommits || 0);
                        case 'all':
                            return (b.totalCommits || 0) - (a.totalCommits || 0);
                        default:
                            return 0;
                    }
                });

                console.log("Updated leaderboard data:", sortedResults);
                setLeaderboardData(sortedResults);
            } catch (error) {
                console.error("Error fetching leaderboard data:", error);
            }
        };

        fetchLeaderboardData();
    }, [userData, leaderboardView, recentCommits]); // Added recentCommits as dependency

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
        if (!commitText.trim()) return;

        const userRef = doc(db, "users", user.uid);
        const now = new Date();
        const formattedDate = now.toISOString().split("T")[0];
        const formattedTime = now.toLocaleTimeString("en-US", { 
            hour: '2-digit', 
            minute: '2-digit', 
            timeZone: "America/New_York" 
        });

        try {
            await updateDoc(userRef, {
                commits_master: arrayUnion({
                    date: formattedDate,
                    text: commitText,
                    timestamp: formattedTime,
                }),
                [`commitCounts.${formattedDate}`]: increment(1),
                'totalCommits': increment(1),
                'dailyCommits': increment(1),
                'weeklyCommits': increment(1),
                'monthlyCommits': increment(1)
            });

            // Update local state
            const updatedDocSnap = await getDoc(userRef);
            if (updatedDocSnap.exists()) {
                setUserData(updatedDocSnap.data());
                setCommitText("");
                fetchCommits();
                
                // Re-fetch leaderboard data to reflect the new commit
                const leaderboardQuery = query(
                    collection(db, "users"),
                    where("username", "in", [...userData.friends, userData.username])
                );
                const querySnapshot = await getDocs(leaderboardQuery);
                const results = querySnapshot.docs.map(doc => doc.data());
                
                // Sort based on current view
                const sortedResults = results.sort((a, b) => {
                    switch(leaderboardView) {
                        case 'day':
                            return (b.dailyCommits || 0) - (a.dailyCommits || 0);
                        case 'week':
                            return (b.weeklyCommits || 0) - (a.weeklyCommits || 0);
                        case 'month':
                            return (b.monthlyCommits || 0) - (a.monthlyCommits || 0);
                        case 'all':
                            return (b.totalCommits || 0) - (a.totalCommits || 0);
                        default:
                            return 0;
                    }
                });
                
                setLeaderboardData(sortedResults);
            }
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
                    // Sort commits by date and time in reverse chronological order
                    const commits = Array.isArray(userData.commits_master) 
                        ? userData.commits_master 
                        : Object.values(userData.commits_master);
                    
                    const sortedCommits = commits.sort((a, b) => {
                        // Compare dates first
                        const dateComparison = new Date(b.date) - new Date(a.date);
                        if (dateComparison !== 0) return dateComparison;
                        
                        // If same date, compare times
                        return b.timestamp.localeCompare(a.timestamp);
                    });

                    setRecentCommits(sortedCommits);
                } else {
                    setRecentCommits([]);
                }
                
                // Also update commit counts
                if (userData.commitCounts) {
                    setCommitCounts(userData.commitCounts);
                }
            } else {
                console.log("No such document!");
                setRecentCommits([]);
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
    
        const cleanUsername = friendUsername.replace('@', '');
        
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", cleanUsername));
            const querySnapshot = await getDocs(q);
    
            if (querySnapshot.empty) {
                console.log("User not found");
                return;
            }
    
            const targetUserDoc = querySnapshot.docs[0];
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
    
            await batch.commit();
    
            // Clear input field immediately
            setFriendUsername('');
    
            // Update UI
            const updatedUserRef = doc(db, "users", user.uid);
            const updatedDocSnap = await getDoc(updatedUserRef);
            if (updatedDocSnap.exists()) {
                setUserData(updatedDocSnap.data());
                fetchPendingRequests();
            }

    
        } catch (error) {
            console.error("Error sending friend request:", error);
        }
    };

    const handleViewToggle = (view) => {
        setActiveView(view);
    };

    // Add this near your other handler functions
    const handleAcceptRequest = async (request) => {
        try {
            const batch = writeBatch(db);
            
            // Get references to both users
            const currentUserRef = doc(db, "users", user.uid);
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", request.username));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const otherUserRef = querySnapshot.docs[0].ref;

                // Add each user to the other's friends list and remove from requests
                batch.update(currentUserRef, {
                    friends: arrayUnion(request.username),
                    "requests.incoming_requests": userData.requests.incoming_requests.filter(
                        username => username !== request.username
                    )
                });

                batch.update(otherUserRef, {
                    friends: arrayUnion(userData.username),
                    "requests.pending_requests": request.requests.pending_requests.filter(
                        username => username !== userData.username
                    )
                });

                await batch.commit();
                console.log("Friend request accepted successfully");

                // Update local state
                const updatedDocSnap = await getDoc(currentUserRef);
                if (updatedDocSnap.exists()) {
                    setUserData(updatedDocSnap.data());
                    // Re-fetch pending requests to update UI
                    await fetchPendingRequests();
                }
            }
        } catch (error) {
            console.error("Error accepting friend request:", error);
        }
    };

    const handleDeclineRequest = async (request) => {
        try {
            const batch = writeBatch(db);
            
            // Get references to both users
            const currentUserRef = doc(db, "users", user.uid);
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", request.username));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const otherUserRef = querySnapshot.docs[0].ref;

                // Remove request from both users' lists
                batch.update(currentUserRef, {
                    "requests.incoming_requests": userData.requests.incoming_requests.filter(
                        username => username !== request.username
                    )
                });

                batch.update(otherUserRef, {
                    "requests.pending_requests": request.requests.pending_requests.filter(
                        username => username !== userData.username
                    )
                });

                await batch.commit();
                console.log("Friend request declined");

                // Update local state immediately
                const updatedDocSnap = await getDoc(currentUserRef);
                if (updatedDocSnap.exists()) {
                    setUserData(updatedDocSnap.data());
                    await fetchPendingRequests();
                }
            }
        } catch (error) {
            console.error("Error declining friend request:", error);
        }
    };

    const handleLeaderboardToggle = (view) => {
        setLeaderboardView(view);
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
                            <p className="friends-title"><span className="friend-underline-animation">friends</span></p>
                            <div className="all-or-pending">
                                <button 
                                    onClick={() => handleViewToggle('all')}
                                    style={{ backgroundColor: activeView === 'all' ? '#b8e0f7' : 'white' }}
                                >
                                    All
                                </button>
                                <p className="divider">|</p>
                                <button 
                                    onClick={() => handleViewToggle('pending')}
                                    style={{ backgroundColor: activeView === 'pending' ? '#b8e0f7' : 'white' }}
                                >
                                    Pending
                                </button>
                            </div>
                        </div>
                        <div className="friends-list">
                            {activeView === 'all' ? (
                                friendsList.length > 0 ? (
                                    friendsList.map((friend, index) => (
                                        <div key={index} className="friend-profile">
                                            <img 
                                                src={friend.pfp || '/blue default pfp.png'} 
                                                alt="" 
                                                className="friend-pic"
                                            />
                                            <div>
                                                <p className="friend-name">
                                                    {friend.name} 
                                                    <span className="friend-username">(@{friend.username})</span>
                                                </p>
                                                <p className="friend-commits">2 commits</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="friend-profile" style={{ 
                                        justifyContent: 'center', 
                                        color: '#1479BC', 
                                        opacity: 0.7, 
                                        fontStyle: 'italic' 
                                    }}>
                                        No friends added yet
                                    </div>
                                )
                            ) : (
                                // Pending requests view - now shows both incoming and outgoing
                                pendingRequests.length > 0 ? (
                                    pendingRequests.map((request, index) => (
                                        <div key={index} className="friend-profile">
                                            <img 
                                                src={request.pfp || '/blue default pfp.png'} 
                                                alt="" 
                                                className="friend-pic"
                                            />
                                            <div>
                                                <p className="friend-name">
                                                    {request.name} 
                                                    <span className="friend-username">(@{request.username})</span>
                                                    <span style={{ 
                                                        fontSize: '12px', 
                                                        color: request.requestType === 'incoming' ? '#2ecc71' : '#3498db', 
                                                        marginLeft: '8px',
                                                        fontStyle: 'italic' 
                                                    }}>
                                                        {request.requestType === 'incoming' ? '(Incoming)' : '(Outgoing)'}
                                                    </span>
                                                </p>
                                                <p className="friend-commits">2 commits</p>
                                                {request.requestType === 'incoming' && (
                                                    <div className="request-actions">
                                                        <button 
                                                            className="accept-button"
                                                            onClick={() => handleAcceptRequest(request)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                marginRight: '8px',
                                                                backgroundColor: '#2ecc71',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Accept
                                                        </button>
                                                        <button 
                                                            className="decline-button"
                                                            onClick={() => handleDeclineRequest(request)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                backgroundColor: '#e74c3c',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="friend-profile" style={{ 
                                        justifyContent: 'center', 
                                        color: '#1479BC', 
                                        opacity: 0.7, 
                                        fontStyle: 'italic' 
                                    }}>
                                        No pending requests
                                    </div>
                                )
                            )}
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
        <div className="leaderboard-content-top">
            <div className="leaderboard-toggle">
                <button 
                    className={`toggle-btn ${leaderboardView === 'day' ? 'active' : ''}`}
                    onClick={() => handleLeaderboardToggle('day')}
                >
                    Day
                </button>
                <p className="divider">|</p>
                <button 
                    className={`toggle-btn ${leaderboardView === 'week' ? 'active' : ''}`}
                    onClick={() => handleLeaderboardToggle('week')}
                >
                    Week
                </button>
                <p className="divider">|</p>
                <button 
                    className={`toggle-btn ${leaderboardView === 'month' ? 'active' : ''}`}
                    onClick={() => handleLeaderboardToggle('month')}
                >
                    Month
                </button>
                <p className="divider">|</p>
                <button 
                    className={`toggle-btn ${leaderboardView === 'all' ? 'active' : ''}`}
                    onClick={() => handleLeaderboardToggle('all')}
                >
                    All-Time
                </button>
            </div>
        </div>
        <div className="leaderboard-entries">
            {leaderboardData.map((user, index) => (
                <div key={index} className="friend-profile">
                    <img 
                        src={user.pfp || '/blue default pfp.png'} 
                        alt="" 
                        className="friend-pic"
                    />
                    <div>
                        <p className="friend-name">
                            {user.name}
                            <span className="friend-username">(@{user.username})</span>
                        </p>
                        <p className="friend-commits">
                            {leaderboardView === 'day' ? user.dailyCommits || 0 :
                             leaderboardView === 'week' ? user.weeklyCommits || 0 :
                             leaderboardView === 'month' ? user.monthlyCommits || 0 :
                             user.totalCommits || 0} commits
                        </p>
                    </div>
                </div>
            ))}
        </div>
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