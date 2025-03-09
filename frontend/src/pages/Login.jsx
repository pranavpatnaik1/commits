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
    const navigate = useNavigate();

    if (user?.uid) {
        return <Navigate to='/app' />;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) return;

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
                            console.log("No such document!");
                        }
                    } catch (error) {
                        console.error("Error getting document:", error);
                    }
                };
                await getUserData(user.uid);
            })
            .catch((error) => {
                console.log(error.code, error.message);
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
        </div>
    );
};