import React from 'react';
import '../assets/style/Commits.css';

export const CommitGrid = ({ commitWeeks, dayIndex, userData, getCommitColorForDate }) => {
    return (
        <div className="commits">
            <p className="month-text">march</p>
            <div className="commit-box">
                {commitWeeks.map((_, weekIndex) => (
                    <div key={weekIndex} className="commit-week">
                        {Array.from({ length: 7 }).map((_, commitIndex) => {
                            const squareIndex = weekIndex * 7 + commitIndex;
                            const isToday = squareIndex === dayIndex;
                            const isPastDay = squareIndex < dayIndex;
                            
                            const squareDate = new Date();
                            squareDate.setDate(squareDate.getDate() - (dayIndex - squareIndex));
                            const formattedSquareDate = squareDate.toISOString().split('T')[0];

                            const dateCommits = userData?.commitCounts?.[formattedSquareDate] || 0;
                            const squareColor = isToday ? getCommitColorForDate(dateCommits) : getCommitColorForDate(dateCommits);
                            const hasCommits = dateCommits > 0;

                            return (
                                <div 
                                    key={commitIndex} 
                                    className={`commit ${isToday ? 'glowing' : hasCommits ? 'past' : isPastDay ? 'dimmed' : ''}`}
                                    style={{ backgroundColor: squareColor }}
                                    data-tooltip={`${dateCommits > 0 ? `\n${dateCommits} commit${dateCommits === 1 ? '' : 's'}` : '\n0 commits'}`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};