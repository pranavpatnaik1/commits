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
        const checkSignUpStatus = async () => {
            if (user?.uid) {
                const userRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setSignUpConfirmed(docSnap.data().signUpConfirm);
                }
            }
        };
        checkSignUpStatus();
    }, [user]);

    if (user?.uid && signUpConfirmed) {
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
                    name: full_name,
                    username: username,
                    email: user.email,
                    createdAt: serverTimestamp(),
                    commits_master: {},
                    friends: [],
                    requests: {
                        pending_requests: [],
                        incoming_requests: []
                    },
                    signUpConfirm: false,
                    pfp: "",
                });
                console.log("User data saved to Firestore");
                navigate('/profile');
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
