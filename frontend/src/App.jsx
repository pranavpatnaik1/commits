import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home.jsx";
import { Login } from "./pages/Login.jsx";
import { Commits } from "./pages/Commits.jsx";
import { Signup } from "./pages/Signup.jsx";
import { Profile } from "./pages/Profile.jsx";
import { VerifyEmail } from './pages/VerifyEmail';
import { onAuthStateChanged } from "firebase/auth";
import "./App.css";
import { auth } from "./firebase.js";
import { ProtectedRoute } from "./components/protectedRoute.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    console.log("Setting up auth listener");
    
    // Check if there's already a user
    if (auth.currentUser) {
      console.log("Found existing user:", auth.currentUser.uid);
      setUser(auth.currentUser);
      setIsFetching(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", {
        uid: currentUser?.uid,
        email: currentUser?.email,
        state: currentUser ? 'authenticated' : 'not authenticated'
      });
      
      setUser(currentUser);
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, []);

  if (isFetching) {
    return (
    <>
      <div className="uploading"></div>
      <div className="upload-overlay">
        <div className="spinner"></div>
      </div>
    </>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login user={user} />} />
        <Route path='/signup' element={<Signup user={user} />} />
        <Route path='/profile' element={<Profile user={user} />} />
        <Route 
          path='/app' 
          element={
            <ProtectedRoute user={user}>
              <Commits user={user} />
            </ProtectedRoute>
          }
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

