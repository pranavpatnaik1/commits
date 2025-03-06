import { Navigate } from "react-router-dom"

export const ProtectedRoute = ({children, user}) => {
    console.log("ProtectedRoute: Checking auth:", {
        hasUser: !!user,
        uid: user?.uid,
        email: user?.email
    });

    // If we have a user with a uid, render the protected content
    if (user?.uid) {
        return children;
    }

    // If no authenticated user, redirect to home
    return <Navigate to='/' replace />;
}