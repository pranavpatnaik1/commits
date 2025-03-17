import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, updateDoc, getDoc, onSnapshot } from "firebase/firestore";
import { Header } from '../components/Header';
import { CommitGrid } from '../components/CommitGrid';
import { RecentCommits } from '../components/RecentCommits';
import { Leaderboard } from '../components/Leaderboard';
import { Friends } from '../components/Friends';
import { Settings } from '../components/Settings';

// Operations imports
import { fetchUserData } from '../assets/operations/userOperations';
import { handleCommit } from '../assets/operations/commitOperations';
import { handleFriendRequest } from '../assets/operations/friendOperations';
import { handleProfilePictureUpdate } from '../assets/operations/profileOperations';
import { toggleDropdown, toggleFriends, toggleSettings } from '../assets/operations/dropdownOperations';
import { fetchLeaderboardData } from '../assets/operations/leaderboardOperations';
import { updateDateTime, getCommitColorForDate } from '../assets/operations/dateTimeOperations';

import "../assets/style/Commits.css";

export const Commits = ({ user }) => {
    const [commitText, setCommitText] = useState("");
    const [recentCommits, setRecentCommits] = useState([]);
    const [currentDate, setCurrentDate] = useState("");
    const [currentTime, setCurrentTime] = useState("");
    const [userData, setUserData] = useState(null);
    const [leaderboardView, setLeaderboardView] = useState('day');
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [showLengthError, setShowLengthError] = useState(false);
    const [profilePic, setProfilePic] = useState(null); // Change from default to null
    const [defaultPics] = useState([
        "/blue default pfp.png",
        "/yellow default pfp.png",
        "/green default pfp.png",
        "/orange default pfp.png",
        "/purple default pfp.png",
        "/red default pfp.png"
    ]);
    const [friendsList, setFriendsList] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friendUsername, setFriendUsername] = useState('');
    const [activeView, setActiveView] = useState('all');
    const [isUploading, setIsUploading] = useState(false);
    const [commitCounts, setCommitCounts] = useState({});
    const MAX_COMMIT_LENGTH = 200;
    const [currentTheme] = useState({
        primary: '#1479BC',
        secondary: '#6DACD5',
        accent: '#2EABFF',
        hover: '#49a8e7',
        border: '#D3ECFC',
        boxShadow: 'rgba(0, 0, 0, 0.445)',
        commitBox: '#6DACD5',
        recentBox: '#6DACD5',
        leaderboardBox: '#6DACD5',
        text: '#1479BC',
        buttonBg: '#2EABFF',
        buttonHover: '#1479BC'
    });

    useEffect(() => {
        fetchUserData(user, setUserData, setProfilePic);
    }, [user]);

    const firstName = userData?.name ? userData.name.split(' ')[0].toLowerCase() : '';
    const fullName = userData?.name || 'User';

    // Update useEffect for date/time
    useEffect(() => {
        const interval = setInterval(() => {
            updateDateTime(setCurrentDate, setCurrentTime);
        }, 1000);
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

    // Update leaderboard effect
    useEffect(() => {
        const updateLeaderboard = async () => {
            const data = await fetchLeaderboardData(userData, leaderboardView);
            setLeaderboardData(data);
        };
        updateLeaderboard();
    }, [userData, leaderboardView, recentCommits]);

    // LOGIN DETAILS

    if (!user) {
        return <Navigate to="/login" />;
    }

    const handleSignOut = () => {
        signOut(auth)
            .then(() => console.log("Sign Out successful"))
            .catch((error) => console.log("Sign Out error:", error));
    };

    const handleCommitWrapper = () => handleCommit(commitText, user, setRecentCommits, setCommitText);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Prevent form submission (if any)
            handleCommitWrapper(); // Trigger commit on Enter key press
        }
    };

    const fetchCommits = () => {
        try {
            const userRef = doc(db, "users", user.uid);
            
            const unsubscribe = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const commits = userData.commits || [];
                    const commitCounts = userData.commitCounts || {};
                    
                    // Update commit counts and user data
                    setCommitCounts(commitCounts);
                    setUserData(userData);
                    
                    // Format and sort commits
                    const formattedCommits = commits
                        .map(commit => ({
                            text: commit.text,
                            date: commit.date,
                            timestamp: commit.timestamp
                        }))
                        .sort((a, b) => {
                            const dateB = new Date(`${b.date} ${b.timestamp}`);
                            const dateA = new Date(`${a.date} ${a.timestamp}`);
                            return dateB - dateA;
                        });

                    setRecentCommits(formattedCommits);
                }
            });

            return unsubscribe;
        } catch (error) {
            console.error("Error setting up commits listener:", error);
            return () => {};
        }
    };

    useEffect(() => {
        const unsubscribe = fetchCommits();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

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
      
    const toggleDropdownWrapper = () => toggleDropdown();

    useEffect(() => {
        const closeDropdowns = (event) => {
            const dropdown = document.getElementById("dropdownMenu");
            const isFriendsClick = event.target.closest('.friends');
            const isProfileClick = event.target.closest('.profile-pic');
            const isDropdownClick = event.target.closest('.dropdown-content');

            // Don't close if clicking on friends icon, profile pic, or within dropdown
            if (!isProfileClick && !isFriendsClick && !isDropdownClick && dropdown?.classList.contains("show")) {
                dropdown.classList.remove("show");
                setTimeout(() => {
                    dropdown.style.visibility = "hidden";
                }, 200);
            }
        };

        document.addEventListener('mousedown', closeDropdowns);
        return () => {
            document.removeEventListener('mousedown', closeDropdowns);
        };
    }, []);

    const toggleFriendsWrapper = (e) => toggleFriends(e);

    useEffect(() => {
        const closeDropdowns = (event) => {
            const dropdown = document.getElementById("dropdownMenu");
            const friendsMenu = document.getElementById("friendsMenu");
            const overlay = document.getElementById("overlay");
            const profilePic = event.target.closest('.profile-pic');
            const friendsButton = event.target.closest('.friends');
            
            // If clicking outside both menus
            if (!profilePic && !friendsButton && !event.target.closest('.dropdown-content') && !event.target.closest('.friends-content')) {
                if (friendsMenu) {
                    friendsMenu.style.display = "none";
                    overlay.style.display = "none";
                }
                if (dropdown?.classList.contains("show")) {
                    dropdown.classList.remove("show");
                    setTimeout(() => {
                        dropdown.style.visibility = "hidden";
                    }, 200);
                }
            }
        };

        document.addEventListener('mousedown', closeDropdowns);
        return () => {
            document.removeEventListener('mousedown', closeDropdowns);
        };
    }, []);

    const handleFriendRequestWrapper = (e) => handleFriendRequest(e, friendUsername, user, userData, setFriendUsername, setUserData, fetchPendingRequests);

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
                        username => userData.username
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

    // Add this helper function near your other utility functions
    const getCommitColorForDate = (commitCount) => {
        const redHue = Math.max(20, 217 - commitCount * 30);
        const greenHue = Math.max(120, 217 - commitCount * 15);
        return `rgb(${redHue}, ${greenHue}, 225)`;
    };

    // Add this function near your other toggle functions
    const toggleSettingsWrapper = (e) => toggleSettings(e);
      
    useEffect(() => {
        const closeDropdowns = (event) => {
            const dropdown = document.getElementById("dropdownMenu");
            const friendsMenu = document.getElementById("friendsMenu");
            const settingsMenu = document.getElementById("settingsMenu");
            const overlay = document.getElementById("overlay");
            const profilePic = event.target.closest('.profile-pic');
            const friendsButton = event.target.closest('.friends');
            const settingsButton = event.target.closest('.settings');
            const settingsContent = event.target.closest('.settings-content');
            
            // If clicking outside any menu and not on any trigger buttons
            if (!profilePic && 
                !friendsButton && 
                !settingsButton && 
                !settingsContent &&
                !event.target.closest('.dropdown-content') && 
                !event.target.closest('.friends-content')) {
                
                if (friendsMenu) {
                    friendsMenu.style.display = "none";
                }
                if (settingsMenu) {
                    settingsMenu.style.display = "none";
                }
                if (overlay) {
                    overlay.style.display = "none";
                }
                if (dropdown?.classList.contains("show")) {
                    dropdown.classList.remove("show");
                    setTimeout(() => {
                        dropdown.style.visibility = "hidden";
                    }, 200);
                }
            }
        };

        document.addEventListener('mousedown', closeDropdowns);
        return () => {
            document.removeEventListener('mousedown', closeDropdowns);
        };
    }, []);

    const handleProfilePictureUpdateWrapper = (event) => handleProfilePictureUpdate(event, userData, user, setProfilePic, setIsUploading);

    // Add this function
    const handleConfirmProfileUpdate = async (finalPic) => {
        try {
            console.log("Starting profile update with:", finalPic);
            const userRef = doc(db, "users", user.uid);
            
            // Update Firestore
            await updateDoc(userRef, {
                pfp: finalPic
            });
            
            // Update local state
            setProfilePic(finalPic);
            
            // Update userData
            const freshDoc = await getDoc(userRef);
            if (freshDoc.exists()) {
                setUserData(freshDoc.data());
            }

            console.log("Profile update completed successfully");
        } catch (error) {
            console.error("Error updating profile picture:", error);
        }
    };

    const handleThemeChange = (newTheme) => {
        setCurrentTheme(newTheme);
        applyTheme(newTheme);
    };
    
    return (
        <div className="main" style={{ backgroundColor: currentTheme.primary }}>
            <Header 
                firstName={firstName}
                currentDate={currentDate}
                currentTime={currentTime}
                userData={userData}
                handleSignOut={handleSignOut}
                profilePic={profilePic}
                toggleDropdown={toggleDropdownWrapper}
                commitsToday={commitsToday}
                toggleFriends={toggleFriendsWrapper}
                toggleSettings={toggleSettingsWrapper}
            />

            <CommitGrid 
                commitWeeks={commitWeeks}
                dayIndex={dayIndex}
                userData={userData}
                getCommitColorForDate={getCommitColorForDate}
                commitColor={commitColor}
            />

            <div className="interaction">
                <RecentCommits 
                    recentCommits={recentCommits}
                    formattedDate={formattedDate}
                />
                
                <Leaderboard 
                    leaderboardView={leaderboardView}
                    handleLeaderboardToggle={handleLeaderboardToggle}
                    leaderboardData={leaderboardData}
                />
            </div>

            <div className="committer">
                <p>commit</p>
                <input 
                    type="text" 
                    className="commit-input" 
                    placeholder="Record results"
                    value={commitText}
                    onChange={(e) => setCommitText(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                
                {showLengthError && (
                    <div className="length-error">
                        Commit too long (max 50 characters)
                    </div>
                )}
            </div>

            <Friends 
                activeView={activeView}
                handleViewToggle={handleViewToggle}
                friendsList={friendsList}
                pendingRequests={pendingRequests}
                friendUsername={friendUsername}
                setFriendUsername={setFriendUsername}
                handleFriendRequest={handleFriendRequestWrapper}
                handleAcceptRequest={handleAcceptRequest}
                handleDeclineRequest={handleDeclineRequest}
            />

            <Settings 
                profilePic={profilePic}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                userData={{
                    ...userData,
                    totalCommits: userData?.commits?.length || 0 // Ensure we're getting the total count
                }}
                onConfirm={handleConfirmProfileUpdate}
                user={user}
            />

            <div id="overlay" className="overlay"></div>
        </div>
    );
};