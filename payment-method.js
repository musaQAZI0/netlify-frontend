document.addEventListener('DOMContentLoaded', function () {
    initializeFormHandlers();
    setupPaymentForm();
});

function setupPaymentForm() {
    const form = document.querySelector('.payment-form');
    form.addEventListener('submit', handlePaymentSubmit);
}

function handlePaymentSubmit(e) {
    e.preventDefault();

    // Get form data
    const paymentData = {
        cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
        cardExpiry: document.getElementById('cardExpiry').value,
        cardCvv: document.getElementById('cardCvv').value,
        nameOnCard: document.getElementById('nameOnCard').value
    };

    // Store payment method in local storage
    localStorage.setItem('paymentMethod', JSON.stringify(paymentData));

    // Get return URL from local storage
    const returnUrl = localStorage.getItem('returnToSettings') || 'settings.html';

    // Navigate back to settings page
    window.location.href = returnUrl;
}

function initializeFormHandlers() {
    // Card number formatting
    const cardInput = document.getElementById('cardNumber');
    cardInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Expiry date formatting
    const expiryInput = document.getElementById('cardExpiry');
    expiryInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });

    // CVC formatting
    const cvcInput = document.getElementById('cardCvc');
    cvcInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        e.target.value = value;
    });
}

function validateForm() {
    const form = document.getElementById('paymentForm');
    const email = document.getElementById('billingEmail');
    const country = document.getElementById('billingCountry');
    const name = document.getElementById('nameOnCard');
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('cardExpiry');
    const cvc = document.getElementById('cardCvc');

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value)) {
        alert('Please enter a valid email address');
        return false;
    }

    // Country selection validation
    if (!country.value) {
        alert('Please select a billing country');
        return false;
    }

    // Name validation
    if (name.value.trim().length < 2) {
        alert('Please enter the name as it appears on your card');
        return false;
    }

    // Card number validation (16 digits)
    const cardNumberClean = cardNumber.value.replace(/\s/g, '');
    if (cardNumberClean.length !== 16) {
        alert('Please enter a valid 16-digit card number');
        return false;
    }

    // Expiry date validation (MM/YY format)
    const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryPattern.test(expiry.value)) {
        alert('Please enter a valid expiry date (MM/YY)');
        return false;
    }

    // CVC validation (3-4 digits)
    if (cvc.value.length < 3 || cvc.value.length > 4) {
        alert('Please enter a valid CVC (3-4 digits)');
        return false;
    }

    return true;
}

function submitPaymentForm() {
    if (validateForm()) {
        // Here you would typically send the data to your server
        // For now, we'll just show a success message
        alert('Payment method saved successfully!');
        window.history.back();
    }
}
