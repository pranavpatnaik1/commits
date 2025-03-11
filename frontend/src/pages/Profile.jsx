import "../assets/style/Profile.css";
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";

export const Profile = ({user}) => {
    const navigate = useNavigate();
    const defaultImages = [
        "/blue default pfp.png",
        "/yellow default pfp.png",
        "/green default pfp.png",
        "/orange default pfp.png",
        "/purple default pfp.png",
        "/red default pfp.png"
    ];
    
    const [currentPicIndex, setCurrentPicIndex] = useState(0);
    const fileInputRef = useRef(null);
    const [userData, setUserData] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedPic, setUploadedPic] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.uid) {
                const userRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            }
        };
        fetchUserData();
    }, [user]);

    const handlePrevious = () => {
        setCurrentPicIndex(prev => 
            prev === 0 ? defaultImages.length - 1 : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentPicIndex(prev => 
            prev === defaultImages.length - 1 ? 0 : prev + 1
        );
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true); // Start loading state
            if (!userData?.username) {
                console.error("Username not found in userData");
                return;
            }

            // Delete existing profile pictures
            const profilePicsRef = ref(storage, 'profile_pictures');
            const fileList = await listAll(profilePicsRef);
            
            const existingPics = fileList.items.filter(item => 
                item.name.startsWith(userData.username + '.')
            );

            // Delete each existing profile picture
            await Promise.all(
                existingPics.map(pic => deleteObject(pic))
            );

            // Upload new picture
            const fileExtension = file.name.split('.').pop();
            const storageRef = ref(storage, `profile_pictures/${userData.username}.${fileExtension}`);
            
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Update user document and state
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                pfp: downloadURL
            });
            setUploadedPic(downloadURL); // Store the uploaded URL

            console.log("Profile picture updated successfully");
            
            const imgElement = document.querySelector('.profile-profile-picture');
            if (imgElement) {
                imgElement.src = downloadURL;
            }
        } catch (error) {
            console.error("Error handling profile picture:", error);
        } finally {
            setIsUploading(false); // End loading state
        }
    };

    const completeSetup = async () => {
        const userRef = doc(db, "users", user.uid);
        try {
            // Use uploaded pic if it exists, otherwise use default
            const finalPfp = uploadedPic || defaultImages[currentPicIndex];
            
            await updateDoc(userRef, {
                signUpConfirm: true,
                pfp: finalPfp
            });
            
            console.log("Profile setup completed with pfp:", finalPfp);
            navigate('/app');
        } catch (error) {
            console.error("Error updating signup confirmation:", error);
        }
    };

    return (
        <div className="profile-profile-page">
            <div className="profile-box">
                <div className="profile-picture-container">
                    <button className="arrow left-arrow" onClick={handlePrevious}>
                        &#8592;
                    </button>
                    <div style={{ position: 'relative' }}>
                        <img 
                            src={defaultImages[currentPicIndex]} 
                            alt="Profile" 
                            className={`profile-profile-picture ${isUploading ? 'uploading' : ''}`}
                        />
                        {isUploading && (
                            <div className="upload-overlay">
                                <div className="spinner"></div>
                            </div>
                        )}
                        <button className="upload-button" onClick={handleUploadClick}>
                            +
                        </button>
                        <input 
                            type="file"
                            ref={fileInputRef}
                            className="file-input"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    <button className="arrow right-arrow" onClick={handleNext}>
                        &#8594;
                    </button>
                </div>
                <p className="profile-name">Pranav Patnaik</p>
                <p className="profile-username">@pranavpatnaik_</p>
                <button className="confirm-style" onClick={completeSetup}>
                    Confirm Profile
                </button>
            </div>
        </div>
    );
};
