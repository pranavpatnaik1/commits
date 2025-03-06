/* eslint react/prop-types: 0 */
import { useState } from "react"
import { createUserWithEmailAndPassword,
    signInWithEmailAndPassword
 } from "firebase/auth";
import { auth } from "../firebase";
import { Navigate } from "react-router-dom";

export const Home = ({user}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUpActive, setIsSignupActive] = useState(false);

    console.log("Home: Current user state:", {
        user,
        uid: user?.uid,
        email: user?.email
    });

    if (user?.uid) {
        console.log("Home: Redirecting to private, found uid:", user.uid);
        return <Navigate to='/private' />;
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
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log(user);
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.log(errorCode, errorMessage);
                });
        } else {
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    console.log(user);
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
            <h2>HomePage</h2>
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