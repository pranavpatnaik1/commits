import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Navigate, useNavigate } from "react-router-dom";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import "../assets/style/Signup.css";

const db = getFirestore();

export const Signup = ({user}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    if (user?.uid) {
        return <Navigate to='/app' />;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) return;

        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                const userRef = doc(db, "users", user.uid);
                await setDoc(userRef, {
                    email: user.email,
                    createdAt: serverTimestamp(),
                    commits_master: {}
                });
                console.log("User data saved to Firestore");
            })
            .catch((error) => {
                console.log(error.code, error.message);
            });
    };

    return (
        <div className="signup signup-page">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <fieldset className="signup-form">
                    <div className="signup-full-name">
                        <p>Full Name</p>
                        <input type="text" className="signup-name"/>
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
