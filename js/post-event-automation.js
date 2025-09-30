class PostEventAutomation {
    constructor() {
        this.automationData = {
            thankYouMessages: {
                sent: 156,
                openRate: 89,
                template: "Thank you for joining us at Summer Music Festival 2024! 🎵 Your energy made the night unforgettable. We'd love to hear your feedback and keep you updated on future events."
            },
            surveys: {
                responses: 89,
                responseRate: 57,
                questions: [
                    {
                        type: 'rating',
                        question: 'How would you rate your overall experience?',
                        average: 4.3
                    },
                    {
                        type: 'text',
                        question: 'What was the highlight of the event?',
                        responses: ['Amazing music!', 'Great atmosphere', 'Perfect venue']
                    },
                    {
                        type: 'rating',
                        question: 'How likely are you to attend future events?',
                        average: 4.6
                    }
                ]
            },
            reviews: [
                {
                    id: 'r1',
                    author: 'Sarah Johnson',
                    avatar: 'SJ',
                    rating: 5,
                    text: 'Absolutely incredible event! The music was fantastic and the organization was flawless. Can\'t wait for the next one!',
                    tags: ['Music', 'Organization', 'Venue'],
                    timestamp: Date.now() - 3600000
                },
                {
                    id: 'r2',
                    author: 'Mike Chen',
                    avatar: 'MC',
                    rating: 4,
                    text: 'Great event overall. The sound quality was excellent and the crowd was amazing. Only minor issue was the long wait times at the bar.',
                    tags: ['Sound Quality', 'Crowd', 'Bar Service'],
                    timestamp: Date.now() - 7200000
                },
                {
                    id: 'r3',
                    author: 'Emma Rodriguez',
                    avatar: 'ER',
                    rating: 5,
                    text: 'Best concert experience I\'ve had in years! The energy was infectious and every moment was perfect.',
                    tags: ['Energy', 'Experience', 'Perfect'],
                    timestamp: Date.now() - 10800000
                },
                {
                    id: 'r4',
                    author: 'James Wilson',
                    avatar: 'JW',
                    rating: 4,
                    text: 'Solid event with great performers. The venue was beautiful and staff was helpful throughout.',
                    tags: ['Performers', 'Venue', 'Staff'],
                    timestamp: Date.now() - 14400000
                },
                {
                    id: 'r5',
                    author: 'Lisa Park',
                    avatar: 'LP',
                    rating: 5,
                    text: 'Exceeded all expectations! From the moment I arrived to the last song, everything was perfectly executed.',
                    tags: ['Expectations', 'Execution', 'Perfect'],
                    timestamp: Date.now() - 18000000
                },
                {
                    id: 'r6',
                    author: 'David Kim',
                    avatar: 'DK',
                    rating: 4,
                    text: 'Amazing artists and great production value. The lighting and stage design were particularly impressive.',
                    tags: ['Artists', 'Production', 'Lighting'],
                    timestamp: Date.now() - 21600000
                }
            ],
            analytics: {
                overallSatisfaction: 4.3,
                recommendationRate: 91,
                returnAttendance: 78
            }
        };

        this.init();
    }

    init() {
        this.renderReviews();
        this.bindEvents();
        this.startAutomationUpdates();
    }

    bindEvents() {
        // Event listeners will be bound via onclick attributes in HTML
    }

    renderReviews() {
        const container = document.getElementById('reviewsGrid');
        if (!container) return;

        const reviewsHtml = this.automationData.reviews.map(review => `
            <div class="review-card fade-in">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${review.avatar}</div>
                        <div class="reviewer-name">${review.author}</div>
                    </div>
                    <div class="review-rating">
                        ${this.renderStars(review.rating)}
                    </div>
                </div>
                <div class="review-text">${review.text}</div>
                <div class="review-tags">
                    ${review.tags.map(tag => `<span class="review-tag">${tag}</span>`).join('')}
                </div>
                <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-light);">
                    ${this.getTimeAgo(review.timestamp)}
                </div>
            </div>
        `).join('');

        container.innerHTML = reviewsHtml;
    }

    renderStars(rating) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(`<span class="star ${i <= rating ? 'active' : ''}">★</span>`);
        }
        return stars.join('');
    }

    getTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            return 'Less than an hour ago';
        }
    }

    editThankYouTemplate() {
        const currentTemplate = this.automationData.thankYouMessages.template;
        const newTemplate = prompt('Edit Thank You Message Template:', currentTemplate);

        if (newTemplate && newTemplate.trim() !== '') {
            this.automationData.thankYouMessages.template = newTemplate.trim();
            this.updateThankYouDisplay();
            this.showNotification('Thank you template updated successfully!', 'success');
        }
    }

    sendThankYouMessages() {
        const confirmed = confirm('Send thank you messages to all attendees? This action cannot be undone.');

        if (confirmed) {
            // Simulate sending process
            this.showNotification('Sending thank you messages...', 'info');

            setTimeout(() => {
                this.automationData.thankYouMessages.sent += 25;
                document.getElementById('thankYouSent').textContent = this.automationData.thankYouMessages.sent;
                this.showNotification('Thank you messages sent successfully!', 'success');
            }, 2000);
        }
    }

    editSurvey() {
        this.showNotification('Survey editor would open here. This feature allows you to customize survey questions, rating scales, and conditional logic.', 'info');
    }

    sendSurvey() {
        const confirmed = confirm('Send survey to all attendees who haven\'t responded yet?');

        if (confirmed) {
            this.showNotification('Sending surveys...', 'info');

            setTimeout(() => {
                this.automationData.surveys.responses += 12;
                this.automationData.surveys.responseRate = Math.round((this.automationData.surveys.responses / 156) * 100);
                document.getElementById('surveyResponses').textContent = this.automationData.surveys.responses;
                document.getElementById('surveyResponseRate').textContent = this.automationData.surveys.responseRate + '%';
                this.showNotification('Surveys sent successfully!', 'success');
            }, 1500);
        }
    }

    editReviewRequest() {
        const currentTemplate = "We hope you had an amazing time! Would you mind leaving us a quick review? Your feedback helps us create even better events.";
        const newTemplate = prompt('Edit Review Request Template:', currentTemplate);

        if (newTemplate && newTemplate.trim() !== '') {
            this.showNotification('Review request template updated successfully!', 'success');
        }
    }

    requestReviews() {
        const confirmed = confirm('Send review requests to all attendees? This will include links to Google, Facebook, and App Store reviews.');

        if (confirmed) {
            this.showNotification('Sending review requests...', 'info');

            setTimeout(() => {
                // Add a new review to simulate collection
                const newReview = {
                    id: 'r' + Date.now(),
                    author: 'New Reviewer',
                    avatar: 'NR',
                    rating: 5,
                    text: 'Just submitted my review! Amazing event, can\'t wait for the next one!',
                    tags: ['Amazing', 'Next Event'],
                    timestamp: Date.now()
                };

                this.automationData.reviews.unshift(newReview);
                document.getElementById('reviewsCollected').textContent = this.automationData.reviews.length;
                this.renderReviews();
                this.showNotification('Review requests sent successfully!', 'success');
            }, 1800);
        }
    }

    updateThankYouDisplay() {
        const templateElements = document.querySelectorAll('.template-content');
        templateElements.forEach(element => {
            if (element.textContent.includes('Thank you for joining us')) {
                element.textContent = `"${this.automationData.thankYouMessages.template}"`;
            }
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            transform: translateX(100%);
        `;

        // Set background color based on type
        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#27ae60';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f39c12';
                break;
            case 'error':
                notification.style.backgroundColor = '#e74c3c';
                break;
            default:
                notification.style.backgroundColor = '#4A90E2';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    startAutomationUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            this.simulateAutomationActivity();
        }, 45000); // Update every 45 seconds
    }

    simulateAutomationActivity() {
        const activities = [
            () => {
                // New survey response
                if (Math.random() > 0.7) {
                    this.automationData.surveys.responses++;
                    this.automationData.surveys.responseRate = Math.round((this.automationData.surveys.responses / 156) * 100);
                    document.getElementById('surveyResponses').textContent = this.automationData.surveys.responses;
                    document.getElementById('surveyResponseRate').textContent = this.automationData.surveys.responseRate + '%';
                }
            },
            () => {
                // New review
                if (Math.random() > 0.8) {
                    const reviewers = ['Alex T.', 'Jordan M.', 'Casey L.', 'Taylor R.', 'Morgan K.'];
                    const comments = [
                        'Great event! Really enjoyed the experience.',
                        'Fantastic organization and amazing performers.',
                        'Will definitely attend future events!',
                        'Exceeded my expectations in every way.',
                        'Perfect venue and excellent sound quality.'
                    ];

                    const newReview = {
                        id: 'r' + Date.now(),
                        author: reviewers[Math.floor(Math.random() * reviewers.length)],
                        avatar: 'AT',
                        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
                        text: comments[Math.floor(Math.random() * comments.length)],
                        tags: ['Event', 'Experience'],
                        timestamp: Date.now()
                    };

                    this.automationData.reviews.unshift(newReview);
                    document.getElementById('reviewsCollected').textContent = this.automationData.reviews.length;
                    this.renderReviews();
                }
            },
            () => {
                // Update open rates
                if (Math.random() > 0.6) {
                    this.automationData.thankYouMessages.openRate = Math.min(95, this.automationData.thankYouMessages.openRate + 1);
                    document.getElementById('thankYouOpenRate').textContent = this.automationData.thankYouMessages.openRate + '%';
                }
            }
        ];

        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        randomActivity();
    }

    // Method to export analytics data
    exportAnalytics() {
        const analyticsData = {
            thankYouMessages: this.automationData.thankYouMessages,
            surveys: {
                totalResponses: this.automationData.surveys.responses,
                responseRate: this.automationData.surveys.responseRate,
                averageRatings: this.automationData.surveys.questions
                    .filter(q => q.type === 'rating')
                    .map(q => ({ question: q.question, average: q.average }))
            },
            reviews: {
                totalReviews: this.automationData.reviews.length,
                averageRating: this.automationData.reviews.reduce((sum, r) => sum + r.rating, 0) / this.automationData.reviews.length,
                recentReviews: this.automationData.reviews.slice(0, 10)
            },
            overallAnalytics: this.automationData.analytics
        };

        console.log('Analytics Data:', analyticsData);
        this.showNotification('Analytics data exported to console', 'success');
        return analyticsData;
    }

    // Method to schedule automation
    scheduleAutomation(type, delay) {
        const scheduleInfo = {
            thankYou: { delay: 2, unit: 'hours' },
            survey: { delay: 24, unit: 'hours' },
            review: { delay: 48, unit: 'hours' }
        };

        const info = scheduleInfo[type];
        if (info) {
            this.showNotification(`${type} automation scheduled for ${info.delay} ${info.unit} after event completion`, 'success');
        }
    }
}

// Initialize the automation system
let postEvent;

document.addEventListener('DOMContentLoaded', () => {
    postEvent = new PostEventAutomation();
});

// Make it globally accessible
window.postEvent = postEvent;