document.addEventListener('DOMContentLoaded', function () {
    const freePlanBtn = document.querySelector('.toggle-btn:first-child');
    const proPlanBtn = document.querySelector('.toggle-btn:last-child');
    const freePlan = document.getElementById('free-plan');
    const proPlans = document.getElementById('pro-plans');

    freePlanBtn.addEventListener('click', function () {
        freePlanBtn.classList.add('active');
        proPlanBtn.classList.remove('active');
        freePlan.style.display = 'block';
        proPlans.style.display = 'none';
    });

    proPlanBtn.addEventListener('click', function () {
        proPlanBtn.classList.add('active');
        freePlanBtn.classList.remove('active');
        freePlan.style.display = 'none';
        proPlans.style.display = 'grid';
    });

    // Initialize subscribe buttons with checkout functionality
    const subscribeButtons = document.querySelectorAll('.subscribe-btn');
    subscribeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const planCard = button.closest('.plan-card');
            const planName = planCard.querySelector('h3').textContent;
            const planPrice = planCard.querySelector('.amount').textContent;
            const features = Array.from(planCard.querySelectorAll('.plan-features li'))
                .map(li => li.textContent);

            // Redirect to checkout page with plan details
            const params = new URLSearchParams({
                plan: planName,
                price: planPrice,
                features: features.join(',')
            });
            window.location.href = `checkout.html?${params.toString()}`;
        });
    });
});
