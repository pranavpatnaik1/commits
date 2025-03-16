import React from 'react';
import '../assets/style/Commits.css';

export const RecentCommits = ({ recentCommits, formattedDate }) => {
    return (
        <div className="recent-commits">
            <p className="recent-title"><u>recent commits</u></p>
            <div className="recent-box">
                {recentCommits.length > 0 ? (
                    recentCommits
                        .filter(commit => commit.date === formattedDate)
                        .map((commit, index) => (
                            <div 
                                key={commit.createdAt || index} 
                                className="commit-entry"
                                style={{ position: 'relative' }}
                            >
                                <p className="commit-name">{commit.text}</p>
                                <span className="commit-time">
                                    {commit.displayTime || commit.timestamp.split(':').slice(0, 2).join(':') + ' ' + commit.timestamp.split(' ')[1]}
                                </span>
                            </div>
                        ))
                ) : (
                    <p>No commits yet!</p>
                )}
            </div>
        </div>
    );
};