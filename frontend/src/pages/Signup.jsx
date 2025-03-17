import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import { Navigate, useNavigate } from "react-router-dom";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import "../assets/style/Signup.css";

const db = getFirestore();

export const Signup = ({user}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [full_name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [signUpConfirmed, setSignUpConfirmed] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [verificationSent, setVerificationSent] = useState(false);
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

    const showErrorMessage = (message) => {
        setErrorMessage(message);
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation checks
        if (!email || !password || !full_name || !username) {
            showErrorMessage("All fields are required");
            return;
        }

        if (password.length < 6) {
            showErrorMessage("Password must be at least 6 characters long");
            return;
        }

        if (username.length < 3) {
            showErrorMessage("Username must be at least 3 characters long");
            return;
        }

        try {
            // Check if username already exists
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                showErrorMessage("Username already taken");
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Send verification email
            await sendEmailVerification(user);
            setVerificationSent(true);
            showErrorMessage("Verification email sent! Please check your inbox");

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
                pfp: "/blue default pfp.png", // Set default profile picture
                emailVerified: false,
            });

            // Wait on profile page redirect until email is verified
            setTimeout(() => {
                navigate('/verify-email', { 
                    replace: true,
                    state: { email: email }
                });
            }, 3000);

        } catch (error) {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    showErrorMessage("An account already exists with this email");
                    break;
                case 'auth/invalid-email':
                    showErrorMessage("Please enter a valid email address");
                    break;
                case 'auth/operation-not-allowed':
                    showErrorMessage("Sign up is currently disabled");
                    break;
                case 'auth/weak-password':
                    showErrorMessage("Password is too weak. Use at least 6 characters");
                    break;
                case 'auth/network-request-failed':
                    showErrorMessage("Network error. Please check your connection");
                    break;
                default:
                    showErrorMessage("Sign up failed. Please try again");
                    break;
            }
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
            {showError && (
                <div className={`signup-error ${verificationSent ? 'success' : ''}`}>
                    {errorMessage}
                </div>
            )}
        </div>
    );
};
