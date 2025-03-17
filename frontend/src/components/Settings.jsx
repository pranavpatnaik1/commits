import React, { useState } from 'react';
import '../assets/style/Settings.css';
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const Settings = ({
    profilePic,
    isUploading,
    setIsUploading,
    userData,
    onConfirm,
    user
}) => {
    const fileInputRef = React.useRef(null);
    const [currentPicIndex, setCurrentPicIndex] = useState(0);
    const [uploadedPic, setUploadedPic] = useState(null);
    
    const defaultImages = [
        "/blue default pfp.png",
        "/yellow default pfp.png",
        "/green default pfp.png",
        "/orange default pfp.png",
        "/purple default pfp.png",
        "/red default pfp.png"
    ];

    const handlePrevious = () => {
        setCurrentPicIndex(prev => 
            prev === 0 ? defaultImages.length - 1 : prev - 1
        );
        setUploadedPic(null);
    };

    const handleNext = () => {
        setCurrentPicIndex(prev => 
            prev === defaultImages.length - 1 ? 0 : prev + 1
        );
        setUploadedPic(null);
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true); // Start loading

            const storage = getStorage();
            const storageRef = ref(storage, `profile_pictures/${userData.username}.jpg`);
            
            // Set temporary preview
            setUploadedPic(URL.createObjectURL(file));
            
            // Upload to Firebase Storage
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            
            // Update the uploaded pic with the Firebase URL
            setUploadedPic(downloadURL);
            
        } catch (error) {
            console.error("Error uploading file:", error);
            setUploadedPic(null);
        } finally {
            setIsUploading(false); // End loading regardless of success/failure
        }
    };

    const handleConfirm = async () => {
        try {
            const finalPic = uploadedPic || defaultImages[currentPicIndex];
            
            // Update Firestore
            const db = getFirestore();
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                pfp: finalPic
            });

            // Call parent's onConfirm
            await onConfirm(finalPic);

            // Close settings menu
            const settingsMenu = document.getElementById("settingsMenu");
            const overlay = document.getElementById("overlay");
            if (settingsMenu) settingsMenu.style.display = "none";
            if (overlay) overlay.style.display = "none";

        } catch (error) {
            console.error("Error confirming changes:", error);
        }
    };

    // Show either uploaded pic or currently selected default pic
    const displayPic = uploadedPic || defaultImages[currentPicIndex];

    return (
        <div className="settings-content" id="settingsMenu" 
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}>
            <div className="settings-content-top">
                <p className="settings-title">
                    <span className="settings-underline-animation">settings</span>
                </p>
            </div>
            <div className="settings-body">
                <div className="settings-layout">
                    <div className="settings-left-section">
                        <div className="profile-picture-section">
                            <div className="profile-picture-container">
                                <div style={{ position: 'relative' }}>
                                    <img 
                                        src={displayPic}
                                        alt="Profile" 
                                        className={`settings-profile-picture ${isUploading ? 'uploading' : ''}`}
                                    />
                                    {isUploading && (
                                        <div className="upload-overlay">
                                            <div className="spinner"></div>
                                        </div>
                                    )}
                                    <button 
                                        className="upload-button" 
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        +
                                    </button>
                                    <input 
                                        type="file"
                                        ref={fileInputRef}
                                        className="file-input"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                            <div className="profile-dots-container">
                                {defaultImages.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`profile-dot ${currentPicIndex === index ? 'active' : ''}`}
                                        onClick={() => {
                                            setCurrentPicIndex(index);
                                            setUploadedPic(null);
                                        }}
                                        style={{
                                            backgroundColor: img.includes('blue') ? '#1479BC' :
                                                           img.includes('yellow') ? '#FFD93D' :
                                                           img.includes('green') ? '#4CAF50' :
                                                           img.includes('orange') ? '#FF9800' :
                                                           img.includes('purple') ? '#9C27B0' :
                                                           img.includes('red') ? '#F44336' : '#1479BC'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="user-info-section">
                            <h2 className="user-full-name">{userData?.firstName} {userData?.lastName}</h2>
                            <p className="user-username">@{userData?.username}</p>
                            <p className="user-commits">Total Commits: {userData?.totalCommits || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            <button className="confirm-profile" onClick={handleConfirm}>
                Confirm Changes
            </button>
        </div>
    );
};