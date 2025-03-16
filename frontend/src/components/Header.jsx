import React from 'react';
import '../assets/style/Commits.css';

export const Header = ({ 
    firstName,
    currentDate,
    currentTime,
    userData,
    handleSignOut,
    profilePic,
    toggleDropdown,
    commitsToday,
    toggleFriends,
    toggleSettings
}) => {
    return (
        <div className="user-greeting">
            <div className="welcome">
                <h2>welcome,</h2>
                <h2 className="name">{firstName}</h2>
            </div>
            <div className="day">{currentDate}</div>
            <div className="time">{currentTime}</div>
            <div className="profile">
                <img 
                    src={profilePic || '/blue default pfp.png'} 
                    alt="" 
                    className='profile-pic'
                    onClick={toggleDropdown}
                />
                <div className="dropdown-content" id="dropdownMenu">
                    <h2 className="user-official-name">{userData?.name}</h2>
                    <p className="username">@{userData?.username}</p>
                    <p className="commit-number">{commitsToday} commits</p>
                    <hr />
                    <div className="admin">
                        <button className="log-out" onClick={handleSignOut}>Sign Out</button>
                        <img src="add friends.png" alt="friends" className="friends" onClick={toggleFriends}/>
                        <img src="settings.png" alt="settings" className="settings" onClick={toggleSettings}/>
                    </div>
                </div>
            </div>
        </div>
    );
};