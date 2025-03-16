import React from 'react';
import '../assets/style/Commits.css';

export const Leaderboard = ({ leaderboardView, handleLeaderboardToggle, leaderboardData }) => {
    return (
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
    );
};