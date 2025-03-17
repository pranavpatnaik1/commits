/* eslint react/prop-types: 0 */
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Navigate, useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import "../assets/style/Login.css";

const db = getFirestore();

export const Login = ({user}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    if (user?.uid) {
        return <Navigate to='/app' />;
    }

    const showErrorMessage = (message) => {
        setErrorMessage(message);
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            showErrorMessage("All fields are required");
            return;
        }

        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                const getUserData = async (userId) => {
                    try {
                        const userDocRef = doc(db, "users", userId);
                        const docSnap = await getDoc(userDocRef);
                
                        if (docSnap.exists()) {
                            console.log("User data:", docSnap.data());
                        } else {
                            showErrorMessage("User account is incomplete. Please contact support.");
                        }
                    } catch (error) {
                        showErrorMessage("Failed to load user data. Please try again.");
                    }
                };
                await getUserData(user.uid);
            })
            .catch((error) => {
                switch (error.code) {
                    case 'auth/invalid-email':
                        showErrorMessage("Please enter a valid email address");
                        break;
                    case 'auth/user-not-found':
                        showErrorMessage("User doesn't exist with this email");
                        break;
                    case 'auth/wrong-password':
                        showErrorMessage("Wrong password. Please try again");
                        break;
                    case 'auth/too-many-requests':
                        showErrorMessage("Too many failed attempts. Please try again later");
                        break;
                    case 'auth/network-request-failed':
                        showErrorMessage("Network error. Please check your connection");
                        break;
                    case 'auth/user-disabled':
                        showErrorMessage("This account has been disabled");
                        break;
                    default:
                        showErrorMessage("Login failed. Please try again");
                        break;
                }
            });
    };

    return (
        <div className="login login-page">
            <legend><h2>Sign In</h2></legend>
            <form onSubmit={handleSubmit}>
                <fieldset className="login-form">
                    <div className="login-email-input">
                        <p className="email-text">Email</p>
                        <input 
                            type="email" 
                            id="email" 
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                        />
                    </div>
                    <div className="login-pwd-input">
                        <p className="email-text">Password</p>
                        <input 
                            type="password" 
                            id="password" 
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                        />
                    </div>
                    <button type="submit" className="login-sign-in-button">Sign In</button>
                </fieldset>
                <button type="button" onClick={() => navigate('/signup')} className="login-to-signup-button">
                    Need an account? Sign up
                </button>
            </form>
            {showError && (
                <div className="login-error">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};