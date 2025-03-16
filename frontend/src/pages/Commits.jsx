import { signOut } from "firebase/auth";
import "../assets/style/Commits.css";
import { auth } from "../firebase";
import { Navigate } from "react-router-dom";
import { 
    getFirestore, 
    doc, 
    updateDoc, 
    arrayUnion, 
    getDoc, 
    increment,
    collection,
    query,
    where,
    getDocs,
    writeBatch
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { storage } from "../firebase";
import React, { useState, useEffect, useRef } from "react";
import { Header } from '../components/Header';
import { CommitGrid } from '../components/CommitGrid';
import { RecentCommits } from '../components/RecentCommits';
import { Leaderboard } from '../components/Leaderboard';
import { Friends } from '../components/Friends';
import { Settings } from '../components/Settings';

const db = getFirestore();

export const Commits = ({ user }) => {
    const [commitText, setCommitText] = useState("");
    const [recentCommits, setRecentCommits] = useState([]);
    const [currentDate, setCurrentDate] = useState("");
    const [currentTime, setCurrentTime] = useState("");
    const [userData, setUserData] = useState(null);
    const [leaderboardView, setLeaderboardView] = useState('day');
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [showLengthError, setShowLengthError] = useState(false);
    const [profilePic, setProfilePic] = useState('/blue default pfp.png');
    const [friendsList, setFriendsList] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friendUsername, setFriendUsername] = useState('');
    const [activeView, setActiveView] = useState('all');
    const [isUploading, setIsUploading] = useState(false);
    const [commitCounts, setCommitCounts] = useState({});
    const MAX_COMMIT_LENGTH = 200;

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
    const fullName = userData?.name || 'User';

    // Function to update the date and time
    const updateDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}); // "HH:MM"
        
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
        
        if (commitText.length > MAX_COMMIT_LENGTH) {
            setShowLengthError(true);
            setTimeout(() => setShowLengthError(false), 3000);
            return;
        }

        const now = new Date();
        const formattedDate = now.toISOString().split("T")[0];
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const fullTimestamp = now.toLocaleTimeString("en-US", { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        const displayTimestamp = now.toLocaleTimeString("en-US", { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        });

        try {
            const newCommit = {
                id: uniqueId,
                date: formattedDate,
                text: commitText,
                timestamp: fullTimestamp,
                displayTime: displayTimestamp,
                createdAt: Date.now()
            };

            // Update the recentCommits state immediately
            setRecentCommits(prevCommits => [newCommit, ...prevCommits]);

            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                commits_master: arrayUnion(newCommit),
                [`commitCounts.${formattedDate}`]: increment(1),
                'totalCommits': increment(1),
                'dailyCommits': increment(1),
                'weeklyCommits': increment(1),
                'monthlyCommits': increment(1)
            });

            setCommitText("");
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
        if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
            setTimeout(() => {
                dropdown.style.visibility = "hidden";
            }, 200); // Match transition duration
        } else {
            dropdown.style.visibility = "visible";
            requestAnimationFrame(() => {
                dropdown.classList.add("show");
            });
        }
    };

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

    const toggleFriends = (e) => {
        e.stopPropagation();
        const friendsMenu = document.getElementById("friendsMenu");
        const overlay = document.getElementById("overlay");
        const dropdown = document.getElementById("dropdownMenu");
        
        if (friendsMenu) {
            const isVisible = friendsMenu.style.display === "block";
            friendsMenu.style.display = isVisible ? "none" : "block";
            overlay.style.display = isVisible ? "none" : "block";
            
            if (dropdown) {
                dropdown.classList.remove("show");
                dropdown.style.visibility = "hidden";
            }
        }
    };

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
    const toggleSettings = (e) => {
        e.stopPropagation();
        const settingsMenu = document.getElementById("settingsMenu");
        const overlay = document.getElementById("overlay");
        const dropdown = document.getElementById("dropdownMenu");
        
        if (settingsMenu) {
            const isVisible = settingsMenu.style.display === "block";
            settingsMenu.style.display = isVisible ? "none" : "block";
            overlay.style.display = isVisible ? "none" : "block";
            
            if (dropdown) {
                dropdown.classList.remove("show");
                dropdown.style.visibility = "hidden";
            }
        }
    };
      
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

    const handleProfilePictureUpdate = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        try {
            setIsUploading(true);
            if (!userData?.username) {
                console.error("Username not found in userData");
                return;
            }
    
            // Delete existing profile pictures
            const profilePicsRef = ref(storage, 'profile_pictures');
            const fileList = await listAll(profilePicsRef);
            
            const existingPics = fileList.items.filter(item => 
                item.name.startsWith(userData.username + '.')
            );
    
            await Promise.all(existingPics.map(pic => deleteObject(pic)));
    
            // Upload new picture
            const fileExtension = file.name.split('.').pop();
            const storageRef = ref(storage, `profile_pictures/${userData.username}.${fileExtension}`);
            
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Update user document
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                pfp: downloadURL
            });
    
            setProfilePic(downloadURL);
        } catch (error) {
            console.error("Error updating profile picture:", error);
        } finally {
            setIsUploading(false);
        }
    };

    // Add this function
    const handleConfirmProfileUpdate = async (finalPic) => {
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                pfp: finalPic
            });
            setProfilePic(finalPic);
            
            // Close settings menu
            const settingsMenu = document.getElementById("settingsMenu");
            const overlay = document.getElementById("overlay");
            if (settingsMenu) {
                settingsMenu.style.display = "none";
                overlay.style.display = "none";
            }
        } catch (error) {
            console.error("Error updating profile picture:", error);
        }
    };
    
    return (
        <div className="main">
            <Header 
                firstName={firstName}
                currentDate={currentDate}
                currentTime={currentTime}
                userData={userData}
                handleSignOut={handleSignOut}
                profilePic={profilePic}
                toggleDropdown={toggleDropdown}
                commitsToday={commitsToday}
                toggleFriends={toggleFriends}
                toggleSettings={toggleSettings}
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
                handleFriendRequest={handleFriendRequest}
                handleAcceptRequest={handleAcceptRequest}
                handleDeclineRequest={handleDeclineRequest}
            />

            <Settings 
                profilePic={profilePic}
                isUploading={isUploading}
                handleProfilePictureUpdate={handleProfilePictureUpdate}
                userData={userData}
                onConfirm={handleConfirmProfileUpdate}
            />

            <div id="overlay" className="overlay"></div>
        </div>
    );
};