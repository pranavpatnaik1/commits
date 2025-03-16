import React from 'react';
import '../assets/style/Commits.css';

export const Friends = ({
    activeView,
    handleViewToggle,
    friendsList,
    pendingRequests,
    friendUsername,
    setFriendUsername,
    handleFriendRequest,
    handleAcceptRequest,
    handleDeclineRequest
}) => {
    return (
        <div className="friends-content" id="friendsMenu">
            <div className="friends-content-top">
                <p className="friends-title">
                    <span className="friend-underline-animation">friends</span>
                </p>
                <div className="all-or-pending">
                    <button 
                        onClick={() => handleViewToggle('all')}
                        style={{ backgroundColor: activeView === 'all' ? '#b8e0f7' : 'white' }}
                    >
                        All
                    </button>
                    <p className="divider">|</p>
                    <button 
                        onClick={() => handleViewToggle('pending')}
                        style={{ backgroundColor: activeView === 'pending' ? '#b8e0f7' : 'white' }}
                    >
                        Pending
                    </button>
                </div>
            </div>
            <div className="friends-list">
                {activeView === 'all' ? (
                    friendsList.length > 0 ? (
                        friendsList.map((friend, index) => (
                            <div key={index} className="friend-profile">
                                <img 
                                    src={friend.pfp || '/blue default pfp.png'} 
                                    alt="" 
                                    className="friend-pic"
                                />
                                <div>
                                    <p className="friend-name">
                                        {friend.name} 
                                        <span className="friend-username">(@{friend.username})</span>
                                    </p>
                                    <p className="friend-commits">
                                        {friend.totalCommits || 0} commits
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="friend-profile" style={{ 
                            justifyContent: 'center', 
                            color: '#1479BC', 
                            opacity: 0.7, 
                            fontStyle: 'italic' 
                        }}>
                            No friends added yet
                        </div>
                    )
                ) : (
                    pendingRequests.length > 0 ? (
                        pendingRequests.map((request, index) => (
                            <div key={index} className="friend-profile">
                                <img 
                                    src={request.pfp || '/blue default pfp.png'} 
                                    alt="" 
                                    className="friend-pic"
                                />
                                <div>
                                    <p className="friend-name">
                                        {request.name} 
                                        <span className="friend-username">(@{request.username})</span>
                                        <span style={{ 
                                            fontSize: '12px', 
                                            color: request.requestType === 'incoming' ? '#2ecc71' : '#3498db', 
                                            marginLeft: '8px',
                                            fontStyle: 'italic' 
                                        }}>
                                            {request.requestType === 'incoming' ? '(Incoming)' : '(Outgoing)'}
                                        </span>
                                    </p>
                                    <p className="friend-commits">
                                        {request.totalCommits || 0} commits
                                    </p>
                                    {request.requestType === 'incoming' && (
                                        <div className="request-actions">
                                            <button 
                                                className="accept-button"
                                                onClick={() => handleAcceptRequest(request)}
                                                style={{
                                                    padding: '4px 8px',
                                                    marginRight: '8px',
                                                    backgroundColor: '#2ecc71',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                className="decline-button"
                                                onClick={() => handleDeclineRequest(request)}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#e74c3c',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="friend-profile" style={{ 
                            justifyContent: 'center', 
                            color: '#1479BC', 
                            opacity: 0.7, 
                            fontStyle: 'italic' 
                        }}>
                            No pending requests
                        </div>
                    )
                )}
            </div>
            <div className="invite-friends">
                <form onSubmit={handleFriendRequest}>
                    <input 
                        type="text" 
                        className="friend-input" 
                        placeholder="Invite friends (@username)" 
                        value={friendUsername}
                        onChange={(e) => setFriendUsername(e.target.value)}
                    />
                </form>
            </div>
        </div>
    );
};