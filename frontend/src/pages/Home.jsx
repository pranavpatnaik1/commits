import React, { useState, useEffect } from "react";
import "../assets/style/Home.css";
import { useNavigate } from "react-router-dom";

export const Home = () => {
    const navigate = useNavigate();
    const commitWeeks = Array.from({ length: 54 });
    const colors = ['#d9d9d9', '#118FE2', '#6DACD5', '#8BD1FF', '#B3E0FF', '#D1EEFF', '#E6F7FF', '#F0FAFF'];
    const [litCommits, setLitCommits] = useState(new Set());

    const getRandomColor = () => {
        // 80% chance to get the default color
        return Math.random() > 0.2 ? colors[Math.floor(Math.random() * colors.length)] : colors[0];
    };

    const shouldRenderBlock = (weekIndex, commitIndex) => {
        if (commitIndex <= 7) return true; // Bottom squares always show
        
        // concave effect to top portion 
        const normalizedWeek = (weekIndex - 27) / 27; // -1 to 1 range
        const heightLimit = (1 - Math.sqrt(1 - normalizedWeek * normalizedWeek)) * 8;
        return commitIndex <= (8 + heightLimit);
    };

    useEffect(() => {
        let timeouts = [];
        commitWeeks.forEach((_, weekIndex) => {
            Array.from({ length: 16 }).forEach((_, commitIndex) => {
                if (shouldRenderBlock(weekIndex, commitIndex)) {
                    const delay = Math.random() * 1800; // Random delay up to 2s
                    const timeout = setTimeout(() => {
                        setLitCommits(prev => new Set([...prev, `${weekIndex}-${commitIndex}`]));
                    }, delay);
                    timeouts.push(timeout);
                }
            });
        });
        return () => timeouts.forEach(t => clearTimeout(t));
    }, []);

    const getCommitColor = () => {
        return colors[Math.floor(Math.random() * (colors.length - 1)) + 1]; // Skip gray color
    };

    return (
        <>
            <nav className="nav-bar">
                <img src="/commits-logo.png" alt="logo" className="home-logo"/>
                <p className="nav-logo">commits</p>
            </nav>
            <div className="home-container">
                <h2 className="commit-slogan">It's time to <i>commit.</i></h2>
                <button className="start-now-btn" onClick={() => navigate('/signup')}>start now</button>
                <div className="grid-container">
                    {commitWeeks.map((_, weekIndex) => (
                        <div key={weekIndex} className="commit-week">
                            {Array.from({ length: 16 }).map((_, commitIndex) => (
                                shouldRenderBlock(weekIndex, commitIndex) && (
                                    <div 
                                        key={commitIndex} 
                                        className={`home-commit ${litCommits.has(`${weekIndex}-${commitIndex}`) ? 'lit' : ''}`}
                                        style={{ 
                                            '--final-color': getCommitColor()
                                        }}
                                    />
                                )
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
