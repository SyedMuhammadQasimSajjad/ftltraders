// footer.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Automatically update the footer copyright year
    const yearElements = document.querySelectorAll('.footer-year');
    const currentYear = new Date().getFullYear();
    yearElements.forEach(el => {
        el.textContent = currentYear;
    });

    // 2. Modal Logic Setup
    const openButtons = document.querySelectorAll('[data-modal-open]');
    const closeButtons = document.querySelectorAll('[data-modal-close]');
    const modals = document.querySelectorAll('.modal-overlay');

    // Helper function to close a modal safely
    function closeModal(modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = ''; // Restore background scrolling
    }

    // Open Modal when a footer link is clicked
    openButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior just in case
            const modalId = button.getAttribute('data-modal-open');
            const modal = document.getElementById(modalId);

            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex'); // Add flex to center the content
                document.body.style.overflow = 'hidden'; // Stop the page from scrolling behind the modal
            }
        });
    });

    // Close Modal when the "X" button is clicked
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal-overlay');
            if (modal) {
                closeModal(modal);
            }
        });
    });

    // Close Modal when clicking the dark background overlay
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            // Only close if the actual background was clicked, not the white box inside it
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Bonus: Close Modal when pressing the 'Escape' key on the keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal-overlay:not(.hidden)');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });
});