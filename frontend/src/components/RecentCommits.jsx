import React from 'react';
import '../assets/style/Commits.css';

export const RecentCommits = ({ recentCommits, formattedDate }) => {
    // Helper function to format time from timestamp
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        return timestamp.split(' ')[0];  // Get just the time part
    };

    // Filter commits for today and sort by timestamp
    const todaysCommits = recentCommits
        ?.filter(commit => {
            // Handle both old and new data structures
            const commitDate = commit.date || 
                             (commit.timestamp && new Date(commit.timestamp).toISOString().split('T')[0]);
            return commitDate === formattedDate;
        })
        .sort((a, b) => {
            const timeA = new Date(`${a.date} ${a.timestamp || a.displayTime}`);
            const timeB = new Date(`${b.date} ${b.timestamp || b.displayTime}`);
            return timeB - timeA;
        });

    return (
        <div className="recent-commits">
            <p className="recent-title"><u>recent commits</u></p>
            <div className="recent-box">
                {todaysCommits && todaysCommits.length > 0 ? (
                    todaysCommits.map((commit, index) => (
                        <div 
                            key={`${commit.date}-${commit.timestamp || commit.displayTime}-${index}`}
                            className="commit-entry"
                        >
                            <p className="commit-name">{commit.text}</p>
                            <span className="commit-time">
                                {formatTime(commit.timestamp || commit.displayTime)}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="no-commits">No commits yet!</p>
                )}
            </div>
        </div>
    );
};