function confirmDeletion() {
    return confirm("Sigur vrei sa stergi aceasta intrebare?");
}


function publishQuestion () {

    const questionId = document.getElementById("question-id").value;


    fetch(`/teacher_dashboard/question/publish_question/`, {
        method: "POST",
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'Content-Type': "application/json",
        },
        body: JSON.stringify({question_id: questionId})
    })

    .then(response => response.json())
    .then(data => {

        if (data.success) {
            alert("Intrebarea a fost publicata cu succes.");
        }
        else {
            console.error("Eroare in publicarea intrebarii: ", error);
        }
    })
}



function editQuestion() {

    const form = document.getElementById('question-form');
    const formData = new FormData(form);
    

    const selectedCategoriesInputs = document.querySelectorAll('#selected-category-inputs input');
    selectedCategoriesInputs.forEach(input => {
        formData.append('categories', input.value);
    });
    

    const question_id = document.getElementById("question-id").value;    
    

    fetch(`/teacher_dashboard/edit_question/${question_id}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        body: formData
    })
    .then(response => {
        if (response.ok) {
            alert("Întrebarea a fost actualizată cu succes.");
        } 
    })
    .catch(error => {
        console.error('Eroare:', error);
        alert('A apărut o eroare la procesarea răspunsului.');
    });
}