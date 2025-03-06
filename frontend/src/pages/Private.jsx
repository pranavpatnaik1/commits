import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { Navigate } from "react-router-dom";

export const Private = ({ user }) => {
    if (!user) {
        return <Navigate to="/login" />;
    }

    const handleSignOut = () => {
        signOut(auth)
            .then(() => console.log("Sign Out successful"))
            .catch((error) => console.log("Sign Out error:", error));
    };
    
    return (
        <section>
            <h2>Private Page</h2>
            <p>Welcome, {user.email}</p>
            <button onClick={handleSignOut}>Sign Out</button>
        </section>
    );
};