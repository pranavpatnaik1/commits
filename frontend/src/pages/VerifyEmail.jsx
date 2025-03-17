import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import "../assets/style/VerifyEmail.css";

export const VerifyEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;
    const [isVerified, setIsVerified] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationType, setNotificationType] = useState(""); // "success" or "error"

    useEffect(() => {
        const checkVerification = setInterval(() => {
            auth.currentUser?.reload().then(() => {
                if (auth.currentUser?.emailVerified) {
                    setIsVerified(true);
                    clearInterval(checkVerification);
                    setTimeout(() => {
                        navigate('/profile', { replace: true });
                    }, 2000);
                }
            });
        }, 2000);

        return () => clearInterval(checkVerification);
    }, [navigate]);

    const showMessage = (message, type = "error") => {
        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    const handleResendEmail = async () => {
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                showMessage("Verification email resent!", "success");
            }
        } catch (error) {
            console.error("Error sending verification email:", error);
            showMessage("Failed to resend verification email");
        }
    };

    return (
        <div className="verify-email-container">
            <h1>Verify Your Email</h1>
            <p className="verification-sent-msg">We've sent a verification email to:</p>
            <p className="email-address">{email}</p>
            <p className="please-check">Please check your inbox and click the verification link to continue.</p>
            
            {isVerified ? (
                <div className="success-message">
                    Email verified! Redirecting to profile setup...
                </div>
            ) : (
                <button onClick={handleResendEmail} className="resend-button">
                    Resend Verification Email
                </button>
            )}

            {showNotification && (
                <div className={`notification ${notificationType}`}>
                    {notificationMessage}
                </div>
            )}
        </div>
    );
};