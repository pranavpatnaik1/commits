import React, { useState, useEffect } from "react";
import "../assets/style/Home.css";
import { useNavigate } from "react-router-dom";

export const Home = () => {
    const navigate = useNavigate();
    
    // Update the calculateWeeks function to add more weeks based on screen width
    const calculateWeeks = () => {
        const squareWidth = 24; // 19px width + 5px margin
        const screenWidth = window.innerWidth;
        // Add more weeks as the screen gets wider
        return Math.floor(screenWidth / squareWidth) + 1; // This automatically adds more columns
    }; 
     
    const [numWeeks, setNumWeeks] = useState(calculateWeeks());
    const commitWeeks = Array.from({ length: numWeeks });
    const colors = ['#d9d9d9', '#118FE2', '#6DACD5', '#8BD1FF', '#B3E0FF', '#D1EEFF', '#E6F7FF', '#F0FAFF'];
    const [litCommits, setLitCommits] = useState(new Set());
    const [forceUpdate, setForceUpdate] = useState(0);

    // Update the shouldRenderBlock function to have a taller curve on smaller screens
    const shouldRenderBlock = (weekIndex, commitIndex) => {
        // Check if we're on a small screen
        const isSmallScreen = window.innerWidth <= 800;
        const isBigScreen = window.innerWidth >= 1800;
        
        // Increase base height for small screens (from 8 to 10)
        const baseHeight = isSmallScreen ? 11 : isBigScreen ? 11 : 8;
        
        // Bottom squares always show up to the baseHeight
        if (commitIndex <= baseHeight) return true;
        
        // Calculate curve based on screen width - keeps same curve shape
        const halfWeeks = numWeeks / 2;
        const normalizedWeek = (weekIndex - halfWeeks) / halfWeeks; // -1 to 1 range
        
        // Increase curve height multiplier for small screens (from 10 to 12)
        const heightMultiplier = isSmallScreen ? 13 : isBigScreen ? 7 : 10;
        const heightLimit = (1 - Math.sqrt(1 - normalizedWeek * normalizedWeek)) * heightMultiplier;
        
        return commitIndex <= (baseHeight + heightLimit);
    };

    // Add resize listener
    useEffect(() => {
        const handleResize = () => {
            setNumWeeks(calculateWeeks());
            // Reset lit commits on resize to avoid display issues
            setLitCommits(new Set());
            // Force re-render to apply new curve height
            setForceUpdate(prev => prev + 1);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
    }, [numWeeks]);

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
                <h2 className="home-commit-slogan">It's time to <i>commit.</i></h2>
                <p className="home-commit-subtitle">Reach your goals, <span className="home-underline-animation">one commit at a time.</span></p>
                <button className="home-start-now-btn" onClick={() => navigate('/signup')}>start now</button>
                
                <div className="home-grid-container">
                    {commitWeeks.map((_, weekIndex) => (
                        <div key={weekIndex} className="home-commit-week">
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
