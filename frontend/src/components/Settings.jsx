import React, { useState } from 'react';
import '../assets/style/Commits.css';

export const Settings = ({
    profilePic,
    isUploading,
    handleProfilePictureUpdate,
    userData,
    onConfirm
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
    };

    const handleNext = () => {
        setCurrentPicIndex(prev => 
            prev === defaultImages.length - 1 ? 0 : prev + 1
        );
    };

    const handleConfirm = async () => {
        const finalPic = uploadedPic || defaultImages[currentPicIndex];
        await onConfirm(finalPic);
    };

    // Show either uploaded pic, existing profile pic, or currently selected default pic
    const displayPic = uploadedPic || (profilePic?.startsWith('http') ? profilePic : defaultImages[currentPicIndex]);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedPic(URL.createObjectURL(file));
            await handleProfilePictureUpdate(event);
        }
    };

    return (
        <div 
            className="settings-content" 
            id="settingsMenu" 
            onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <div className="settings-content-top">
                <p className="settings-title">
                    <span className="settings-underline-animation">settings</span>
                </p>
            </div>
            <div className="settings-body">
                <div className="profile-picture-section">
                    <div className="profile-picture-container">
                        <button className="arrow left-arrow" onClick={handlePrevious}>
                            &#8592;
                        </button>
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
                        <button className="arrow right-arrow" onClick={handleNext}>
                            &#8594;
                        </button>
                    </div>
                    <button className="confirm-profile" onClick={handleConfirm}>
                        Confirm Changes
                    </button>
                </div>
            </div>
        </div>
    );
};