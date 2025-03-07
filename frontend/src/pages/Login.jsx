/* eslint react/prop-types: 0 */
import { useState } from "react"
import { createUserWithEmailAndPassword,
    signInWithEmailAndPassword
 } from "firebase/auth";
import { auth } from "../firebase";
import { Navigate } from "react-router-dom";
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"; 
import React from "react";

const db = getFirestore();

export const Login = ({user}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUpActive, setIsSignupActive] = useState(false);

    console.log("Login: Current user state:", {
        user,
        uid: user?.uid,
        email: user?.email
    });

    if (user?.uid) {
        console.log("Login: Redirecting to private, found uid:", user.uid);
        return <Navigate to='/app' />;
    }

    const handleMethodChange = (e) => {
        e.preventDefault();
        setIsSignupActive(!isSignUpActive);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) return;

        if (isSignUpActive) {
            createUserWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    console.log(user);

                    const userRef = doc(db, "users", user.uid);  // Reference to user's document
                    await setDoc(userRef, {
                        email: user.email,
                        createdAt: serverTimestamp(),
                        commits_master: {}
                    });

                    console.log("User data saved to Firestore");
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        } else {
            signInWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    console.log(user);

                    const getUserData = async (userId) => {
                        try {
                            const userDocRef = doc(db, "users", userId);
                            const docSnap = await getDoc(userDocRef);
                    
                            if (docSnap.exists()) {
                                console.log("User data:", docSnap.data());
                                // Do something with the user data (e.g., update UI)
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
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        }
    };

    const handleEmailChange = (event) => setEmail(event.target.value);
    const handlePasswordChange = (event) => setPassword(event.target.value);

    

    



    return (
        <section>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                {isSignUpActive ? <legend>Sign Up</legend> : <legend>Sign In</legend>}
                <fieldset>
                    <ul>
                        <li>
                            <label htmlFor="email">Email</label>
                            <input type="email" id="email" onChange={handleEmailChange} required/>
                        </li>

                        <li>
                            <label htmlFor="password">Password</label>
                            <input type="password" id="password" onChange={handlePasswordChange} required/>
                        </li>
                    </ul>
                    <button type="submit">
                        {isSignUpActive ? 'Sign Up' : 'Sign In'}
                    </button>
                </fieldset>
                <button type="button" onClick={handleMethodChange}>
                    {isSignUpActive ? 'Already have an account? Login' : 'Need an account? Sign Up'}
                </button>
            </form>
        </section>
    )
}