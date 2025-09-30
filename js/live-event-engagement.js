class LiveEventEngagement {
    constructor() {
        this.currentTab = 'icebreakers';
        this.eventData = {
            questions: [],
            polls: [],
            qaItems: [],
            photos: [],
            chatMessages: []
        };
        this.userVotes = new Set();
        this.blockedUsers = new Set();
        this.init();
    }

    init() {
        this.initializeTabs();
        this.loadInitialData();
        this.bindEvents();
        this.startRealtimeUpdates();
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;

                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');

                this.currentTab = tabId;
                this.updateTabContent(tabId);
            });
        });
    }

    loadInitialData() {
        this.eventData.questions = [
            {
                id: 'q1',
                text: 'What\'s your favorite memory from a live music event?',
                responses: [
                    { author: 'Sarah M.', text: 'When the artist came into the crowd during their encore!', avatar: 'SM' },
                    { author: 'Mike K.', text: 'Meeting my favorite band backstage after the show', avatar: 'MK' },
                    { author: 'Lisa P.', text: 'Singing along with thousands of people to my favorite song', avatar: 'LP' }
                ],
                responseCount: 47,
                timestamp: Date.now() - 300000
            },
            {
                id: 'q2',
                text: 'If you could have any superpower for one day, what would it be?',
                responses: [
                    { author: 'David L.', text: 'Time travel to see all the concerts I missed!', avatar: 'DL' },
                    { author: 'Emma R.', text: 'Flying so I could get the best view from above', avatar: 'ER' }
                ],
                responseCount: 23,
                timestamp: Date.now() - 150000
            }
        ];

        this.eventData.polls = [
            {
                id: 'poll1',
                question: 'What type of music are you most excited to hear tonight?',
                options: [
                    { text: 'Rock', votes: 45, percentage: 35 },
                    { text: 'Pop', votes: 38, percentage: 30 },
                    { text: 'Electronic', votes: 25, percentage: 20 },
                    { text: 'Hip-Hop', votes: 19, percentage: 15 }
                ],
                totalVotes: 127,
                userVoted: false
            },
            {
                id: 'poll2',
                question: 'How did you hear about this event?',
                options: [
                    { text: 'Social Media', votes: 62, percentage: 45 },
                    { text: 'Friend Recommendation', votes: 41, percentage: 30 },
                    { text: 'Email Newsletter', votes: 21, percentage: 15 },
                    { text: 'Website', votes: 14, percentage: 10 }
                ],
                totalVotes: 138,
                userVoted: true
            }
        ];

        this.eventData.qaItems = [
            {
                id: 'qa1',
                question: 'Will there be a meet and greet with the artists?',
                author: 'Jessica T.',
                upvotes: 23,
                answered: true,
                answer: 'Yes! Meet and greet will be available after the show for VIP ticket holders.',
                timestamp: Date.now() - 600000
            },
            {
                id: 'qa2',
                question: 'What time does the main act go on stage?',
                author: 'Ryan C.',
                upvotes: 18,
                answered: true,
                answer: 'The main act is scheduled to perform at 9:30 PM.',
                timestamp: Date.now() - 450000
            },
            {
                id: 'qa3',
                question: 'Are there any food restrictions we should know about?',
                author: 'Maria L.',
                upvotes: 12,
                answered: false,
                timestamp: Date.now() - 200000
            }
        ];

        this.eventData.photos = [
            {
                id: 'photo1',
                author: 'Alex B.',
                caption: 'The crowd is amazing tonight! 🎵',
                likes: 34,
                approved: true,
                timestamp: Date.now() - 180000
            },
            {
                id: 'photo2',
                author: 'Taylor W.',
                caption: 'Best view in the house!',
                likes: 28,
                approved: true,
                timestamp: Date.now() - 120000
            },
            {
                id: 'photo3',
                author: 'Jamie R.',
                caption: 'Pre-show vibes ✨',
                likes: 15,
                approved: false,
                timestamp: Date.now() - 60000
            }
        ];

        this.eventData.chatMessages = [
            {
                id: 'msg1',
                author: 'EventHost',
                content: 'Welcome everyone! The show starts in 30 minutes. Get excited! 🎉',
                timestamp: Date.now() - 1800000,
                isHost: true
            },
            {
                id: 'msg2',
                author: 'MusicFan23',
                content: 'So pumped for tonight! This is going to be epic!',
                timestamp: Date.now() - 1200000
            },
            {
                id: 'msg3',
                author: 'ConcertGoer',
                content: 'Anyone else here for the first time? This venue looks incredible!',
                timestamp: Date.now() - 900000
            }
        ];

        this.updateAllContent();
    }

    bindEvents() {
        document.getElementById('submitQuestion')?.addEventListener('click', () => this.submitQuestion());
        document.getElementById('submitPhoto')?.addEventListener('click', () => this.submitPhoto());
        document.getElementById('sendMessage')?.addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
    }

    updateTabContent(tabId) {
        switch(tabId) {
            case 'icebreakers':
                this.renderIcebreakers();
                break;
            case 'polls':
                this.renderPolls();
                break;
            case 'qa':
                this.renderQA();
                break;
            case 'photos':
                this.renderPhotos();
                break;
            case 'chat':
                this.renderChat();
                break;
        }
    }

    updateAllContent() {
        this.renderIcebreakers();
        this.renderPolls();
        this.renderQA();
        this.renderPhotos();
        this.renderChat();
        this.updateStats();
    }

    renderIcebreakers() {
        const container = document.getElementById('icebreakersContent');
        if (!container) return;

        const questionsHtml = this.eventData.questions.map(question => `
            <div class="question-card fade-in">
                <div class="question-text">${question.text}</div>
                <div class="question-stats">
                    <span>${question.responseCount} responses</span>
                    <span>${this.getTimeAgo(question.timestamp)}</span>
                </div>
                <div class="responses-grid">
                    ${question.responses.map(response => `
                        <div class="response-card">
                            <div class="response-author">
                                <div class="author-avatar">${response.avatar}</div>
                                <span class="author-name">${response.author}</span>
                            </div>
                            <div class="response-text">${response.text}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="liveEvent.respondToQuestion('${question.id}')">
                        <i class="fas fa-reply"></i> Add Response
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = questionsHtml;
    }

    renderPolls() {
        const container = document.getElementById('pollsContent');
        if (!container) return;

        const pollsHtml = this.eventData.polls.map(poll => `
            <div class="poll-card fade-in">
                <div class="poll-question">${poll.question}</div>
                <div class="poll-options">
                    ${poll.options.map((option, index) => `
                        <div class="poll-option ${this.userVotes.has(poll.id) ? 'selected' : ''}"
                             onclick="liveEvent.voteInPoll('${poll.id}', ${index})">
                            <div class="poll-option-text">${option.text}</div>
                            <div class="poll-progress">
                                <div class="poll-progress-bar" style="width: ${option.percentage}%"></div>
                            </div>
                            <div class="poll-stats">
                                <span>${option.votes} votes</span>
                                <span>${option.percentage}%</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 1rem; color: #7f8c8d; font-size: 0.9rem;">
                    Total votes: ${poll.totalVotes}
                    ${poll.userVoted ? ' • You voted' : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = pollsHtml;
    }

    renderQA() {
        const container = document.getElementById('qaContent');
        if (!container) return;

        const qaHtml = `
            <div class="questions-list">
                ${this.eventData.qaItems.map(item => `
                    <div class="question-item fade-in">
                        <div class="question-header">
                            <div class="question-content">
                                <div class="question-title">${item.question}</div>
                                <div class="question-meta">
                                    <span>Asked by ${item.author}</span>
                                    <span>${this.getTimeAgo(item.timestamp)}</span>
                                    <span>${item.upvotes} upvotes</span>
                                </div>
                                ${item.answered ? `
                                    <div style="margin-top: 1rem; padding: 1rem; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #27ae60;">
                                        <strong>Answer:</strong> ${item.answer}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="question-actions">
                                <button class="action-btn upvote" onclick="liveEvent.upvoteQuestion('${item.id}')">
                                    <i class="fas fa-thumbs-up"></i> ${item.upvotes}
                                </button>
                                ${!item.answered ? `
                                    <button class="action-btn answer" onclick="liveEvent.answerQuestion('${item.id}')">
                                        <i class="fas fa-comment"></i> Answer
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="question-form">
                <div class="form-group">
                    <label class="form-label">Ask a Question</label>
                    <textarea class="form-textarea" id="questionInput" placeholder="What would you like to know about the event?"></textarea>
                </div>
                <button class="btn btn-primary" id="submitQuestion">
                    <i class="fas fa-paper-plane"></i> Submit Question
                </button>
            </div>
        `;

        container.innerHTML = qaHtml;
        document.getElementById('submitQuestion')?.addEventListener('click', () => this.submitQuestion());
    }

    renderPhotos() {
        const container = document.getElementById('photosContent');
        if (!container) return;

        const moderationHtml = `
            <div class="moderation-panel">
                <div class="moderation-title">
                    <i class="fas fa-shield-alt"></i>
                    Photo Moderation
                </div>
                <div class="moderation-stats">
                    <div class="mod-stat">
                        <div class="mod-stat-number">${this.eventData.photos.filter(p => p.approved).length}</div>
                        <div class="mod-stat-label">Approved</div>
                    </div>
                    <div class="mod-stat">
                        <div class="mod-stat-number">${this.eventData.photos.filter(p => !p.approved).length}</div>
                        <div class="mod-stat-label">Pending</div>
                    </div>
                    <div class="mod-stat">
                        <div class="mod-stat-number">${this.eventData.photos.length}</div>
                        <div class="mod-stat-label">Total</div>
                    </div>
                </div>
            </div>
        `;

        const photosHtml = `
            <div class="photo-wall">
                ${this.eventData.photos.map(photo => `
                    <div class="photo-item fade-in ${!photo.approved ? 'pending-approval' : ''}">
                        <div class="photo-image">
                            📸 Photo by ${photo.author}
                        </div>
                        <div class="photo-info">
                            <div class="photo-author">${photo.author}</div>
                            <div class="photo-caption">${photo.caption}</div>
                            <div class="photo-actions">
                                <div class="photo-likes">
                                    <button class="like-btn" onclick="liveEvent.likePhoto('${photo.id}')">
                                        <i class="fas fa-heart"></i>
                                    </button>
                                    <span>${photo.likes} likes</span>
                                </div>
                                ${!photo.approved ? `
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button class="btn btn-success" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;"
                                                onclick="liveEvent.approvePhoto('${photo.id}')">Approve</button>
                                        <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;"
                                                onclick="liveEvent.rejectPhoto('${photo.id}')">Reject</button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 2rem;">
                <div class="question-form">
                    <div class="form-group">
                        <label class="form-label">Share a Photo</label>
                        <input type="file" class="form-input" id="photoInput" accept="image/*">
                    </div>
                    <div class="form-group">
                        <input type="text" class="form-input" id="photoCaption" placeholder="Add a caption...">
                    </div>
                    <button class="btn btn-primary" id="submitPhoto">
                        <i class="fas fa-camera"></i> Share Photo
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = moderationHtml + photosHtml;
        document.getElementById('submitPhoto')?.addEventListener('click', () => this.submitPhoto());
    }

    renderChat() {
        const container = document.getElementById('chatContent');
        if (!container) return;

        const chatHtml = `
            <div class="chat-container">
                <div class="chat-messages" id="chatMessages">
                    ${this.eventData.chatMessages.map(message => `
                        <div class="chat-message fade-in">
                            <div class="message-header">
                                <div class="message-avatar">${message.author.substring(0, 2).toUpperCase()}</div>
                                <span class="message-author ${message.isHost ? 'host' : ''}">${message.author}</span>
                                <span class="message-time">${this.getTimeAgo(message.timestamp)}</span>
                            </div>
                            <div class="message-content">${message.content}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="chat-input">
                    <input type="text" id="chatInput" placeholder="Type your message..." autocomplete="off">
                    <button class="btn btn-primary" id="sendMessage">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = chatHtml;

        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        document.getElementById('sendMessage')?.addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
    }

    updateStats() {
        const stats = {
            activeUsers: 156,
            questionsAnswered: this.eventData.questions.reduce((total, q) => total + q.responseCount, 0),
            pollVotes: this.eventData.polls.reduce((total, p) => total + p.totalVotes, 0),
            photosShared: this.eventData.photos.length
        };

        document.getElementById('activeUsers').textContent = stats.activeUsers;
        document.getElementById('questionsAnswered').textContent = stats.questionsAnswered;
        document.getElementById('pollVotes').textContent = stats.pollVotes;
        document.getElementById('photosShared').textContent = stats.photosShared;
    }

    respondToQuestion(questionId) {
        const response = prompt('Share your response:');
        if (response && response.trim()) {
            const question = this.eventData.questions.find(q => q.id === questionId);
            if (question) {
                question.responses.unshift({
                    author: 'You',
                    text: response.trim(),
                    avatar: 'YU'
                });
                question.responseCount++;
                this.renderIcebreakers();
                this.updateStats();
            }
        }
    }

    voteInPoll(pollId, optionIndex) {
        if (this.userVotes.has(pollId)) return;

        const poll = this.eventData.polls.find(p => p.id === pollId);
        if (poll) {
            poll.options[optionIndex].votes++;
            poll.totalVotes++;
            poll.userVoted = true;
            this.userVotes.add(pollId);

            poll.options.forEach(option => {
                option.percentage = Math.round((option.votes / poll.totalVotes) * 100);
            });

            this.renderPolls();
            this.updateStats();
        }
    }

    submitQuestion() {
        const input = document.getElementById('questionInput');
        if (input && input.value.trim()) {
            const newQuestion = {
                id: 'qa' + Date.now(),
                question: input.value.trim(),
                author: 'You',
                upvotes: 0,
                answered: false,
                timestamp: Date.now()
            };

            this.eventData.qaItems.unshift(newQuestion);
            input.value = '';
            this.renderQA();
        }
    }

    upvoteQuestion(questionId) {
        const question = this.eventData.qaItems.find(q => q.id === questionId);
        if (question) {
            question.upvotes++;
            this.renderQA();
        }
    }

    answerQuestion(questionId) {
        const answer = prompt('Provide your answer:');
        if (answer && answer.trim()) {
            const question = this.eventData.qaItems.find(q => q.id === questionId);
            if (question) {
                question.answered = true;
                question.answer = answer.trim();
                this.renderQA();
            }
        }
    }

    submitPhoto() {
        const fileInput = document.getElementById('photoInput');
        const captionInput = document.getElementById('photoCaption');

        if (fileInput && fileInput.files[0]) {
            const newPhoto = {
                id: 'photo' + Date.now(),
                author: 'You',
                caption: captionInput ? captionInput.value || 'No caption' : 'No caption',
                likes: 0,
                approved: false,
                timestamp: Date.now()
            };

            this.eventData.photos.unshift(newPhoto);

            if (fileInput) fileInput.value = '';
            if (captionInput) captionInput.value = '';

            this.renderPhotos();
            this.updateStats();
        }
    }

    likePhoto(photoId) {
        const photo = this.eventData.photos.find(p => p.id === photoId);
        if (photo) {
            photo.likes++;
            this.renderPhotos();
        }
    }

    approvePhoto(photoId) {
        const photo = this.eventData.photos.find(p => p.id === photoId);
        if (photo) {
            photo.approved = true;
            this.renderPhotos();
        }
    }

    rejectPhoto(photoId) {
        const photoIndex = this.eventData.photos.findIndex(p => p.id === photoId);
        if (photoIndex !== -1) {
            this.eventData.photos.splice(photoIndex, 1);
            this.renderPhotos();
            this.updateStats();
        }
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        if (input && input.value.trim()) {
            const newMessage = {
                id: 'msg' + Date.now(),
                author: 'You',
                content: input.value.trim(),
                timestamp: Date.now()
            };

            this.eventData.chatMessages.push(newMessage);
            input.value = '';
            this.renderChat();
        }
    }

    getTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    }

    startRealtimeUpdates() {
        setInterval(() => {
            this.simulateRealtimeActivity();
        }, 30000);
    }

    simulateRealtimeActivity() {
        const activities = [
            () => {
                const randomQuestion = this.eventData.questions[Math.floor(Math.random() * this.eventData.questions.length)];
                randomQuestion.responseCount++;
                this.updateStats();
            },
            () => {
                const randomPoll = this.eventData.polls[Math.floor(Math.random() * this.eventData.polls.length)];
                const randomOption = randomPoll.options[Math.floor(Math.random() * randomPoll.options.length)];
                randomOption.votes++;
                randomPoll.totalVotes++;

                randomPoll.options.forEach(option => {
                    option.percentage = Math.round((option.votes / randomPoll.totalVotes) * 100);
                });

                if (this.currentTab === 'polls') this.renderPolls();
                this.updateStats();
            },
            () => {
                const newMessage = {
                    id: 'msg' + Date.now(),
                    author: 'User' + Math.floor(Math.random() * 100),
                    content: 'This event is amazing! 🎉',
                    timestamp: Date.now()
                };
                this.eventData.chatMessages.push(newMessage);
                if (this.currentTab === 'chat') this.renderChat();
            }
        ];

        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        randomActivity();
    }
}

let liveEvent;

document.addEventListener('DOMContentLoaded', () => {
    liveEvent = new LiveEventEngagement();
});

window.liveEvent = liveEvent;