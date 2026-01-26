document.addEventListener("DOMContentLoaded", function () {

    const courseContainer = document.getElementById("course-container");
    const courseId = courseContainer ? courseContainer.getAttribute("data-course-id") : null;

    if (!courseId) {
        console.error("Id does not exist.");
        return;
    }

    const existingCategories = document.querySelectorAll('.selected-category');
    selectedCategories = Array.from(existingCategories).map(cat => cat.getAttribute('data-id'));


    const saveButton = document.getElementById("save-course-button");
    if (saveButton) {
        saveButton.addEventListener("click", function () {
            saveCourseData(courseId); 
        });
    }
});


function saveCourseData(courseId) {

    const courseTitle = document.getElementById("name").value; 
    const courseDescription = document.getElementById("description").value;

    const categoryInputs = document.querySelectorAll("#selected-category-inputs input");
    const categories = Array.from(categoryInputs).map(input => input.value);

    const formData = new FormData();
    formData.append('name', courseTitle);
    formData.append('description', courseDescription);

    categories.forEach(categoryId => {
        formData.append('categories', categoryId);
    });

    const courseImageInput = document.getElementById("course_image");
    if (courseImageInput.files[0]) {
        formData.append('course_image', courseImageInput.files[0]);
    }

    fetch(`/teacher_dashboard/update_course/${courseId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Smth went wrong');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert("Cursul a fost actualizat cu succes.");
                window.location.href = "/teacher_dashboard/teacher_courses"; 
            } else {
                console.error("Eroare:", data);
            }
        })
        .catch(error => {
            console.error("Eroare:", error);
        });
}
