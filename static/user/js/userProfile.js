document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});


function openChangePasswordModal() {
        document.getElementById('change-password-modal').style.display = 'flex';
}


function forgotPassword() {
        document.getElementById('change-password-modal').style.display = 'none';
        document.getElementById('forgot-password-modal').style.display = 'flex';
    }


function openDeleteAccountModal() {
    document.getElementById('delete-account-modal').style.display = 'flex';
}


function changeProfilePhoto() {
    document.getElementById('change-profile-photo-modal').style.display = 'flex';
}

