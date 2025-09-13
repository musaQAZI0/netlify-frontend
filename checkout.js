document.addEventListener('DOMContentLoaded', function () {
    // Get plan details from URL parameters
    const params = new URLSearchParams(window.location.search);
    const planName = params.get('plan') || 'Pro 2K';
    const planPrice = params.get('price') || '15';
    const features = params.get('features')?.split(',') || [
        'Up to 2,000 daily marketing emails',
        '24/7 chat support for any event',
        'Cancel anytime'
    ];

    // Update the plan details in the UI
    document.getElementById('planName').textContent = planName;
    document.getElementById('planAmount').textContent = planPrice;
    updatePlanFeatures(features);
    updateTotalAmount(planPrice);

    // Handle billing frequency change
    const billingInputs = document.querySelectorAll('input[name="billing"]');
    billingInputs.forEach(input => {
        input.addEventListener('change', function () {
            const basePrice = parseFloat(planPrice);
            const total = this.value === 'yearly'
                ? (basePrice * 12 * 0.8).toFixed(2) // 20% discount for yearly
                : basePrice.toFixed(2);
            updateTotalAmount(total);
            updateRenewalTerms(total, this.value, planName);
        });
    });

    // Form validation and submission
    const form = document.getElementById('paymentForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (validateForm()) {
            // Here you would typically send the data to your backend
            alert('Payment processed successfully!');
            window.location.href = 'settings.html'; // Redirect back to settings
        }
    });

    // Card number formatting
    const cardInput = document.getElementById('cardNumber');
    cardInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Expiry date formatting
    const expiryInput = document.getElementById('expiry');
    expiryInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });
});

function updatePlanFeatures(features) {
    const featuresList = document.getElementById('planFeatures');
    featuresList.innerHTML = features.map(feature => `<li>${feature}</li>`).join('');
}

function updateTotalAmount(amount) {
    const totalElement = document.getElementById('totalAmount');
    totalElement.textContent = `$${parseFloat(amount).toFixed(2)}`;
}

function updateRenewalTerms(amount, frequency, planName) {
    const termsElement = document.getElementById('renewalTerms');
    const period = frequency === 'yearly' ? 'year' : 'month';
    termsElement.innerHTML = `Your subscription starts immediately and you'll be charged <span class="price-amount">$${amount}</span> per ${period} for our ${planName} plan until you change or cancel your subscription. Subscription pricing is subject to change. You can change or cancel your plan at any time. Charges won't be refunded when you cancel, unless it's legally required. Ad spend is not included in your subscription. Additional Ticketing Fees apply.`;
}

function validateForm() {
    // Add your form validation logic here
    const requiredFields = ['email', 'country', 'cardName', 'cardNumber', 'expiry', 'cvc'];
    let isValid = true;

    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element.value) {
            element.classList.add('error');
            isValid = false;
        } else {
            element.classList.remove('error');
        }
    });

    return isValid;
}
