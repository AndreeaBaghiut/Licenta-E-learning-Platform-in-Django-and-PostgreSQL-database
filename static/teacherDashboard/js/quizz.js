// Funcția pentru a adăuga un quiz nou
function addQuizz() {
    if (!selectedSubchapterId) {
        alert("Please select a subchapter before adding a quiz.");
        return;
    }

    console.log("Adding quiz under subchapter ID:", selectedSubchapterId);

    // Generăm titlul pentru quiz automat (ex: Q1, Q2, ...)
    const subchapterElement = document.querySelector(`[data-subchapter-id='${selectedSubchapterId}']`);
    let quizList = subchapterElement.querySelector('.quiz-list');

    // Verificăm dacă lista de quiz-uri există, dacă nu, o creăm
    quizList = getOrCreateQuizList(subchapterElement)

    // Generăm numele quiz-ului în funcție de câte quiz-uri există în subcapitol
    const quizCount = quizList.querySelectorAll('.quiz-item').length + 1;
    const quizTitle = `Q${quizCount}`;

    // Salvăm quiz-ul în baza de date și îl adăugăm în interfață
    saveNewQuiz(selectedSubchapterId, quizTitle)
        .then((data) => {
            if (data && data.success) {
                // Verifică dacă quiz-ul există deja pentru a evita duplicarea
                if (!quizList.querySelector(`[data-quiz-id='${data.quiz_id}']`)) {
                    // Adăugăm quiz-ul în listă
                    addQuizToUI(selectedSubchapterId, data.quiz_id, quizTitle);
                    // Selectăm quiz-ul nou adăugat pentru editare
                    selectQuiz(data.quiz_id);
                }
            }
        })
        .catch(error => {
            console.error("Eroare la salvarea quiz-ului:", error);
        });
}

function getOrCreateQuizList(subchapterElement) {
    let quizList = subchapterElement.querySelector('.quiz-list');
    if (!quizList) {
        quizList = document.createElement('ul');
        quizList.classList.add('list-group', 'mt-2', 'quiz-list');
        subchapterElement.appendChild(quizList);
    }
    return quizList;
}



// Funcția pentru a salva un quiz nou în baza de date
function saveNewQuiz(subchapterId, quizTitle) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const quizzUrl = `/teacher_dashboard/subchapter/${subchapterId}/add_quizz/`;

    let formData = new FormData();
    formData.append('title', quizTitle);
    formData.append('subchapter', subchapterId);

    return performFetch(quizzUrl, "POST", {
        'X-CSRFToken': csrfToken,
    }, formData);
}



// Funcția pentru a salva conținutul unui quiz în baza de date
function saveQuizContent(quizId) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const quizContentUrl = `/teacher_dashboard/quiz/${quizId}/save_quiz/`;

    const middleSection = document.querySelector(`.middle[data-quiz-id="${quizId}"]`);
    const questionInput = middleSection.querySelector('.question-input').value;

    const answers = [];
    middleSection.querySelectorAll('.answer-container').forEach(answerDiv => {
        const answerText = answerDiv.querySelector('.answer-input').value;
        const isCorrect = answerDiv.querySelector('.correct-checkbox').checked;
        const answerId = answerDiv.getAttribute('data-answer-id'); // Preluăm ID-ul răspunsului dacă există

        answers.push({
            id: answerId,  // Adăugăm ID-ul răspunsului pentru a fi actualizat, dacă este cazul
            text: answerText,
            is_correct: isCorrect
        });
    });

    return performFetch(quizContentUrl, "POST", {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
    }, JSON.stringify({
        question: questionInput,
        answers: answers
    }))
    .then(response => {
        if (response.success) {
            console.log("Quiz updated successfully.");

            // Actualizăm ID-urile pentru răspunsurile nou create
            response.data.answers.forEach(answer => {
                const answerDiv = middleSection.querySelector(`.answer-container:not([data-answer-id])`);
                if (answerDiv) {
                    answerDiv.setAttribute('data-answer-id', answer.id);
                }
            });
        } else {
            console.error("Error updating quiz:", response.error);
        }
    });
}









// Funcția pentru selectarea unui quiz
function selectQuiz(quizId) {
    console.log("Quiz selectat:", quizId);

    deselectAll();
    deselectAllQuizzes();

    const quizItem = document.querySelector(`[data-quiz-id='${quizId}']`);
    if (quizItem) quizItem.classList.add('selected');

    let middleSection = document.querySelector(`.middle[data-quiz-id="${quizId}"]`);
    if (!middleSection) {
        middleSection = document.createElement('div');
        middleSection.classList.add('middle');
        middleSection.setAttribute('data-quiz-id', quizId);
        document.querySelector('#middle-section').appendChild(middleSection);
    }
    else {
    middleSection.innerHTML = '';}

    middleSection.style.display = 'block';
    middleSection.innerHTML = ''; // Golește secțiunea pentru a preveni duplicarea

    const fetchUrl = `/teacher_dashboard/quiz/${quizId}/content/`;
    performFetch(fetchUrl, "GET", {
        'Content-Type': 'application/json',
    })
    .then(data => {
        if (data && data.success) {
            console.log("Conținutul quiz-ului obținut:", data.quiz);

            // Creează un input pentru întrebarea din quiz și adaugă-l la middleSection
            const questionInput = document.createElement('input');
            questionInput.classList.add('question-input');
            questionInput.type = 'text';
            questionInput.placeholder = 'Insert question';
            questionInput.style.width = '100%';
            questionInput.style.marginBottom = '10px';

            if (data.quiz.questions && data.quiz.questions.length > 0) {
                questionInput.value = data.quiz.questions[0].text;
            } else {
                questionInput.value = '';
            }

            // Adaugă întrebarea în middleSection mai întâi
            middleSection.appendChild(questionInput);

            // Apoi adaugă răspunsurile
            if (data.quiz.questions && data.quiz.questions.length > 0) {
                data.quiz.questions[0].answers.forEach(answer => addAnswer(middleSection, answer.text, answer.is_correct, answer.id));
            }


            // Creează butonul de adăugare a unui răspuns nou
            const addAnswerButton = document.createElement('button');
            addAnswerButton.textContent = 'Add Answer';
            addAnswerButton.classList.add('btn', 'add-answer-btn');
            addAnswerButton.style.marginBottom = '10px';
            addAnswerButton.onclick = () => addAnswer(middleSection);
            middleSection.appendChild(addAnswerButton);

            // Creează butonul pentru salvarea quiz-ului
            const saveQuizzButton = document.createElement('button');
            saveQuizzButton.textContent = 'Save Quiz';
            saveQuizzButton.classList.add('btn', 'save-quiz-btn');
            saveQuizzButton.style.backgroundColor = '#4CAF50';
            saveQuizzButton.style.color = '#fff';
            saveQuizzButton.onclick = () => saveQuizContent(quizId);
            middleSection.appendChild(saveQuizzButton);

            // Creează butonul pentru ștergerea quiz-ului
const deleteQuizzButton = document.createElement('button');
deleteQuizzButton.textContent = 'Delete Quiz';
deleteQuizzButton.classList.add('btn', 'delete-quiz-btn');
deleteQuizzButton.style.backgroundColor = '#f44336';
deleteQuizzButton.style.color = '#fff';
deleteQuizzButton.onclick = () => deleteItem("quiz", quizId);
middleSection.appendChild(deleteQuizzButton);

        } else {
            console.error('Error fetching quiz content:', data.error);
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}



function deselectAll() {
    // Ascunde toate secțiunile .middle pentru a ne asigura că doar quiz-ul selectat este afișat
    document.querySelectorAll('.middle').forEach(section => {
        section.style.display = 'none';
        section.innerHTML = ''; // Curăță secțiunile pentru a preveni duplicarea conținutului
    });

    // Deselectăm orice quiz sau subcapitol selectat anterior
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
}


function deselectAllQuizzes() {
    document.querySelectorAll('.quiz-item.selected').forEach(quiz => {
        quiz.classList.remove('selected');
    });
}


// Funcția pentru a prelua quiz-urile existente din baza de date
function fetchQuizzesFromDB(subchapterId) {
    const fetchUrl =` /teacher_dashboard/subchapter/${subchapterId}/quizzes/`;

    return performFetch(fetchUrl, "GET", {
        'Content-Type': 'application/json',
    })
    .then(data => {
        if (data && data.success) {
            const subchapterElement = document.querySelector(`[data-subchapter-id='${subchapterId}']`);
            const quizList = getOrCreateQuizList(subchapterElement);

            quizList.innerHTML = ''; // Curăță lista existentă de quiz-uri pentru a evita duplicarea

            data.quizzes.forEach(quiz => {
                addQuizToUI(subchapterId, quiz.id, quiz.title, quiz.questions);
            });
        } else {
            console.error('Error fetching quizzes:', data.error);
        }
    });
}



// Funcția pentru a adăuga un quiz în UI
function addQuizToUI(subchapterId, quizId, quizTitle) {
    const subchapterElement = document.querySelector(`[data-subchapter-id='${subchapterId}']`);
    let quizList = subchapterElement.querySelector('.quiz-list');

    // Verificăm dacă lista de quiz-uri există, dacă nu, o creăm
    getOrCreateQuizList(subchapterElement)

    // Verifică dacă quiz-ul există deja înainte de a-l adăuga (evităm duplicarea)
    if (!quizList.querySelector(`[data-quiz-id='${quizId}']`)) {
        // Adăugăm quiz-ul în listă
        const quizItem = document.createElement("li");
        quizItem.classList.add("list-group-item", "quiz-item");
        quizItem.setAttribute('data-quiz-id', quizId);
        quizItem.style.paddingLeft = '40px';
        quizItem.style.marginTop = '10px';

        // Creăm textul pentru quiz
        const quizText = document.createElement("span");
        quizText.textContent = quizTitle;
        quizItem.appendChild(quizText);

        // Adăugăm un event listener pentru selectarea quiz-ului
        quizItem.addEventListener('click', function (event) {
            event.stopPropagation(); // Prevenim propagarea evenimentului către elementele părinte
            selectQuiz(quizId);
        });

        quizList.appendChild(quizItem);
    }
}


// Apelăm funcția fetchQuizzesFromDB pentru fiecare subcapitol la încărcarea paginii
document.addEventListener('DOMContentLoaded', async function () {
    // Iterăm peste fiecare subchapter și preluăm quiz-urile
    for (const subchapterElement of document.querySelectorAll('.subchapter-item')) {
        var subchapterId = subchapterElement.getAttribute('data-subchapter-id');
        await fetchQuizzesFromDB(subchapterId);
    }
});





// Funcția pentru a adăuga un răspuns
function addAnswer(quizDiv, answerText = '', isCorrect = false, answerId = null) {
    const answerContainer = document.createElement('div');
    answerContainer.classList.add('answer-container');
    answerContainer.style.marginBottom = '5px';

    // Setăm ID-ul răspunsului dacă este deja salvat în baza de date
    if (answerId) {
        answerContainer.setAttribute('data-answer-id', answerId);
    }

    // Câmp de text pentru răspuns
    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.placeholder = 'Add answer';
    answerInput.value = answerText;  // Setează valoarea inițială dacă există
    answerInput.classList.add('answer-input');
    answerInput.style.width = '60%';

    // Checkbox pentru răspuns corect
    const correctCheckbox = document.createElement('input');
    correctCheckbox.type = 'checkbox';
    correctCheckbox.classList.add('correct-checkbox');
    correctCheckbox.style.marginLeft = '10px';
    correctCheckbox.checked = isCorrect;  // Setează starea inițială dacă este cazul

    // Label pentru checkbox
    const correctLabel = document.createElement('label');
    correctLabel.textContent = ' Correct';
    correctLabel.style.marginLeft = '5px';

    // Buton pentru ștergerea răspunsului
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('btn', 'delete-btn');
    deleteButton.style.marginLeft = '10px';
    deleteButton.style.backgroundColor = '#f44336';
    deleteButton.style.color = '#fff';
    deleteButton.onclick = function () {
        const answerId = answerContainer.getAttribute('data-answer-id');
        if (answerId) {
            // Ștergere din baza de date
            deleteItem("answer", answerId, answerContainer);
        } else {
            answerContainer.remove(); // Dacă răspunsul nu e salvat, îl eliminăm doar din interfață
        }
    };

    answerContainer.appendChild(answerInput);
    answerContainer.appendChild(correctCheckbox);
    answerContainer.appendChild(correctLabel);
    answerContainer.appendChild(deleteButton);

    // Identifică butonul "Add Answer" și inserează răspunsul înaintea acestuia
    const addAnswerButton = quizDiv.querySelector('.add-answer-btn');
    quizDiv.insertBefore(answerContainer, addAnswerButton);
}







function performFetch(url, method = "GET", headers = {}, body = null) {
    return fetch(url, {
        method,
        headers,
        body
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

// Funcția pentru ștergerea unui răspuns sau a unui quiz
function deleteItem(type, id, quizDiv = null) {
    let url = "";
    if (type === "answer") {
        url = `/teacher_dashboard/quiz/answer/${id}/delete/`; // URL pentru ștergerea unui răspuns
    } else if (type === "quiz") {
        url = `/teacher_dashboard/quiz/${id}/delete/`; // URL pentru ștergerea unui quiz
    }

    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    // Cerere pentru ștergerea din baza de date
    performFetch(url, "DELETE", {
        'X-CSRFToken': csrfToken,
    })
    .then(data => {
        if (data && data.success) {
            if (type === "answer" && quizDiv) {
                quizDiv.remove();
            } else if (type === "quiz") {
                document.querySelector(`[data-quiz-id='${id}']`).remove();
               // deselectAll();
            }
        } else {
            console.error('Error deleting item:', data.error);
        }
    })
    .catch(error => {
        console.error('There was a problem with the delete operation:', error);
    });
}


