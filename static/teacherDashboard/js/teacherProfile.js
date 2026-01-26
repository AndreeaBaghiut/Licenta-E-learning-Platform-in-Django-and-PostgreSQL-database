 function openChangePasswordModal() {
        document.getElementById('change-password-modal').style.display = 'flex';
    }

    function closeChangePasswordModal() {
        document.getElementById('change-password-modal').style.display = 'none';
    }

    function forgotPassword() {
        document.getElementById('change-password-modal').style.display = 'none';
        document.getElementById('forgot-password-modal').style.display = 'flex';
    }

    function closeForgotPasswordModal() {
        document.getElementById('forgot-password-modal').style.display = 'none';
    }

function openDeleteAccountModal() {
    document.getElementById('delete-account-modal').style.display = 'flex';
}

function closeDeleteAccountModal() {
    document.getElementById('delete-account-modal').style.display = 'none';
}

function changeProfilePhoto() {
    document.getElementById('change-profile-photo-modal').style.display = 'flex';
}

function closeChangeProfilePhotoModal() {
    document.getElementById('change-profile-photo-modal').style.display = 'none';
}
