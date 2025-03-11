import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Navigate, useNavigate } from "react-router-dom";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import "../assets/style/Signup.css";

const db = getFirestore();

export const Signup = ({user}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [full_name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [signUpConfirmed, setSignUpConfirmed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Quick check first
        if (!user?.uid) return;

        const checkSignUpStatus = async () => {
            try {
                const userRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userRef);
                
                if (docSnap.exists() && docSnap.data().signUpConfirm) {
                    // Navigate immediately if confirmed
                    navigate('/app', { replace: true });
                }
            } catch (error) {
                console.error("Error checking signup status:", error);
            }
        };

        // Run check immediately
        checkSignUpStatus();
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userRef = doc(db, "users", user.uid);
            
            await setDoc(userRef, {
                name: full_name,
                username: username,
                email: user.email,
                createdAt: serverTimestamp(),
                commits_master: {},
                commitCounts: {},
                totalCommits: 0,
                dailyCommits: 0,
                weeklyCommits: 0,
                monthlyCommits: 0,
                lastReset: new Date().toISOString().split('T')[0],
                lastWeeklyReset: new Date().toISOString().split('T')[0],
                lastMonthlyReset: new Date().toISOString().split('T')[0],
                friends: [],
                requests: {
                    pending_requests: [],
                    incoming_requests: []
                },
                signUpConfirm: false,
                pfp: "",
            });

            // Use replace to allow proper back navigation
            navigate('/profile', { replace: true });
        } catch (error) {
            console.error("Signup error:", error.code, error.message);
        }
    };

    return (
        <div className="signup signup-page">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <fieldset className="signup-form">
                    <div className="signup-full-name">
                        <p>Full Name</p>
                        <input
                        type="text"
                        id="name" 
                        onChange={(e) => setName(e.target.value)} 
                        className="signup-name"/>
                    </div>
                    <div className="signup-email-input">
                        <p>Username</p>
                        <input
                        type="text"
                        id="name" 
                        onChange={(e) => setUsername(e.target.value)} 
                        className="signup-name"/>
                    </div>
                    <div className="signup-email-input">
                        <p>Email</p>
                        <input 
                            type="email" 
                            id="email" 
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                            className="email"
                        />
                    </div>
                    <div className="signup-pwd-input">
                        <p>Password</p>
                        <input 
                            type="password" 
                            id="password" 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                            className="password"
                        />
                    </div>
                    <button type="submit" className="signup-submit-button">Sign Up</button>
                </fieldset>
                <button type="button" onClick={() => navigate('/login')} className="signup-to-login-button">
                    Already have an account? Login
                </button>
            </form>
        </div>
    );
};
