// Good to Know Section Management for Event Builder
class GoodToKnowManager {
    constructor() {
        this.highlights = [];
        this.faqs = [];
        this.highlightCounter = 0;
        this.faqCounter = 0;
        this.initializeEventHandlers();
    }

    // Initialize event handlers
    initializeEventHandlers() {
        // Auto-save on input changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('.highlight-input, .faq-question, .faq-answer')) {
                this.scheduleAutoSave();
            }
        });
    }

    // Add highlight item
    addHighlight(type) {
        const highlightId = `highlight_${this.highlightCounter++}`;
        const container = document.getElementById('highlightsContainer');
        
        if (!container) {
            console.error('Highlights container not found');
            return;
        }

        const highlightConfig = this.getHighlightConfig(type);
        
        const highlightHTML = `
            <div class="highlight-item" data-id="${highlightId}" data-type="${type}">
                <button class="highlight-remove" onclick="goodToKnowManager.removeHighlight('${highlightId}')" title="Remove">
                    ×
                </button>
                <div class="highlight-header">
                    <span class="highlight-type">${highlightConfig.icon} ${highlightConfig.label}</span>
                </div>
                <textarea 
                    class="highlight-input" 
                    placeholder="${highlightConfig.placeholder}"
                    data-highlight-id="${highlightId}"
                    onchange="goodToKnowManager.updateHighlight('${highlightId}', this.value)"
                ></textarea>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', highlightHTML);
        
        // Store highlight data
        this.highlights.push({
            id: highlightId,
            type: type,
            content: '',
            label: highlightConfig.label
        });

        // Focus on the new input
        const newInput = container.querySelector(`[data-highlight-id="${highlightId}"]`);
        if (newInput) {
            newInput.focus();
        }

        this.scheduleAutoSave();
        console.log(`Added ${type} highlight`);
    }

    // Get highlight configuration
    getHighlightConfig(type) {
        const configs = {
            age: {
                label: 'Age Requirements',
                icon: '🔞',
                placeholder: 'e.g., 18+ only, All ages welcome, 21+ for bar area'
            },
            door: {
                label: 'Door Times',
                icon: '🚪',
                placeholder: 'e.g., Doors open at 7:00 PM, Event starts at 8:00 PM'
            },
            parking: {
                label: 'Parking Information',
                icon: '🅿️',
                placeholder: 'e.g., Free street parking available, $10 valet parking, Parking garage entrance on Main St'
            },
            dresscode: {
                label: 'Dress Code',
                icon: '👔',
                placeholder: 'e.g., Business casual, Formal attire required, Come as you are'
            },
            accessibility: {
                label: 'Accessibility',
                icon: '♿',
                placeholder: 'e.g., Wheelchair accessible, ASL interpreter available, Accessible restrooms'
            },
            food: {
                label: 'Food & Drinks',
                icon: '🍽️',
                placeholder: 'e.g., Light refreshments provided, Full bar available, Outside food not permitted'
            }
        };

        return configs[type] || {
            label: type.charAt(0).toUpperCase() + type.slice(1),
            icon: '📋',
            placeholder: `Enter ${type} information...`
        };
    }

    // Update highlight content
    updateHighlight(highlightId, content) {
        const highlight = this.highlights.find(h => h.id === highlightId);
        if (highlight) {
            highlight.content = content;
            this.scheduleAutoSave();
        }
    }

    // Remove highlight
    removeHighlight(highlightId) {
        // Remove from DOM
        const element = document.querySelector(`[data-id="${highlightId}"]`);
        if (element) {
            element.remove();
        }

        // Remove from data
        this.highlights = this.highlights.filter(h => h.id !== highlightId);
        
        this.scheduleAutoSave();
        console.log(`Removed highlight: ${highlightId}`);
    }

    // Add FAQ
    addFAQ() {
        const faqId = `faq_${this.faqCounter++}`;
        const container = document.getElementById('faqContainer');
        
        if (!container) {
            console.error('FAQ container not found');
            return;
        }

        const faqHTML = `
            <div class="faq-item" data-id="${faqId}">
                <button class="faq-remove" onclick="goodToKnowManager.removeFAQ('${faqId}')" title="Remove FAQ">
                    ×
                </button>
                <input 
                    type="text" 
                    class="faq-question" 
                    placeholder="Enter your question..."
                    data-faq-id="${faqId}"
                    data-field="question"
                    onchange="goodToKnowManager.updateFAQ('${faqId}', 'question', this.value)"
                />
                <textarea 
                    class="faq-answer" 
                    placeholder="Enter the answer to help attendees..."
                    data-faq-id="${faqId}"
                    data-field="answer"
                    onchange="goodToKnowManager.updateFAQ('${faqId}', 'answer', this.value)"
                ></textarea>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', faqHTML);
        
        // Store FAQ data
        this.faqs.push({
            id: faqId,
            question: '',
            answer: ''
        });

        // Focus on the question input
        const newQuestion = container.querySelector(`input[data-faq-id="${faqId}"]`);
        if (newQuestion) {
            newQuestion.focus();
        }

        this.scheduleAutoSave();
        console.log(`Added FAQ: ${faqId}`);
    }

    // Update FAQ content
    updateFAQ(faqId, field, content) {
        const faq = this.faqs.find(f => f.id === faqId);
        if (faq) {
            faq[field] = content;
            this.scheduleAutoSave();
        }
    }

    // Remove FAQ
    removeFAQ(faqId) {
        // Remove from DOM
        const element = document.querySelector(`[data-id="${faqId}"]`);
        if (element) {
            element.remove();
        }

        // Remove from data
        this.faqs = this.faqs.filter(f => f.id !== faqId);
        
        this.scheduleAutoSave();
        console.log(`Removed FAQ: ${faqId}`);
    }

    // Get all Good to Know data
    getData() {
        return {
            highlights: this.highlights.filter(h => h.content.trim()),
            faqs: this.faqs.filter(f => f.question.trim() && f.answer.trim())
        };
    }

    // Load existing Good to Know data
    loadData(data) {
        if (!data) return;

        // Clear existing data
        this.highlights = [];
        this.faqs = [];
        document.getElementById('highlightsContainer').innerHTML = '';
        document.getElementById('faqContainer').innerHTML = '';

        // Load highlights
        if (data.highlights) {
            data.highlights.forEach(highlight => {
                this.addHighlight(highlight.type);
                // Update the content after adding
                const input = document.querySelector(`[data-highlight-id="${this.highlights[this.highlights.length - 1].id}"]`);
                if (input) {
                    input.value = highlight.content;
                    this.updateHighlight(this.highlights[this.highlights.length - 1].id, highlight.content);
                }
            });
        }

        // Load FAQs
        if (data.faqs) {
            data.faqs.forEach(faq => {
                this.addFAQ();
                const faqId = this.faqs[this.faqs.length - 1].id;
                
                // Update question and answer
                const questionInput = document.querySelector(`input[data-faq-id="${faqId}"]`);
                const answerInput = document.querySelector(`textarea[data-faq-id="${faqId}"]`);
                
                if (questionInput) {
                    questionInput.value = faq.question;
                    this.updateFAQ(faqId, 'question', faq.question);
                }
                
                if (answerInput) {
                    answerInput.value = faq.answer;
                    this.updateFAQ(faqId, 'answer', faq.answer);
                }
            });
        }

        console.log('Good to Know data loaded');
    }

    // Auto-save functionality
    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            this.saveToEventBuilder();
        }, 1000); // Save after 1 second of no changes
    }

    // Save to event builder data
    saveToEventBuilder() {
        if (window.eventBuilder && window.eventBuilder.api) {
            const goodToKnowData = this.getData();
            window.eventBuilder.api.currentEventData.goodToKnow = goodToKnowData;
            
            // Also trigger the main auto-save
            if (window.eventBuilder.scheduleAutoSave) {
                window.eventBuilder.scheduleAutoSave();
            }
            
            console.log('Good to Know data saved to event');
        }
    }

    // Clear all data
    clearAll() {
        this.highlights = [];
        this.faqs = [];
        document.getElementById('highlightsContainer').innerHTML = '';
        document.getElementById('faqContainer').innerHTML = '';
        this.scheduleAutoSave();
    }

    // Get summary for display
    getSummary() {
        const data = this.getData();
        return {
            highlightCount: data.highlights.length,
            faqCount: data.faqs.length,
            totalItems: data.highlights.length + data.faqs.length
        };
    }
}

// Global instance
window.goodToKnowManager = new GoodToKnowManager();

// Global functions for HTML onclick handlers
function addHighlight(type) {
    window.goodToKnowManager.addHighlight(type);
}

function addFAQ() {
    window.goodToKnowManager.addFAQ();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Good to Know manager initialized');
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoodToKnowManager;
}