function addQuiz() {
    if (!selectedSubchapterId) {
        alert("Trebuie sa selectezi un subcapitol mai intai.");
        return;
    }

    console.log("Adauga quiz pt subcapitolul cu id-ul: ", selectedSubchapterId);

    const subchapterElement = document.querySelector(`[data-subchapter-id='${selectedSubchapterId}']`);
    const quizList = subchapterElement.querySelector('.quiz-list');

    fetch(`/teacher_dashboard/subchapter/${selectedSubchapterId}/add_quiz/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const quizItem = createQuizItem(data.quiz_id, data.quiz_title || data.quiz.title);
            quizList.appendChild(quizItem);

            selectQuiz(data.quiz_id);
        }
        else {
            alert("Noul quiz nu a putut fi adaugat.");
        }
    })
    .catch(error => {
        console.error("Eroare la adaugarea quiz-ului: ", error);
        alert("Eroare la adaugarea quiz-ului.");
    });
}

function createQuizItem(quizId, title) {

    const quizItem = document.createElement("li");
    quizItem.classList.add("list-group-item", "quiz-item");
    quizItem.setAttribute("data-quiz-id", quizId);

    quizItem.style.paddingLeft = '40px';
    quizItem.style.marginTop = '10px';

    const quizTitle = document.createElement("span");
    quizTitle.textContent = title;
    quizItem.appendChild(quizTitle);

    quizItem.addEventListener("click", function(event) {
        event.stopPropagation();
        selectQuiz(quizId);
    });

    return quizItem;
}

function selectQuiz(quizId) {
    console.log("Quiz selectat: ", quizId);
    
    removeSaveButton();

    document.querySelectorAll(".middle").forEach(section => {
        section.style.display = "none";
    });

    document.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"));

    const quizItem = document.querySelector(`[data-quiz-id='${quizId}']`);
    if (quizItem) {
        quizItem.classList.add("selected");
    }

    let middleSection = document.querySelector(`.middle[data-quiz-id='${quizId}']`);
    if (!middleSection) {
        middleSection = document.createElement("div");
        middleSection.classList.add("middle", "quiz-editor");
        middleSection.setAttribute("data-quiz-id", quizId);
        const middleSectionContainer = document.querySelector("#middle-section");
        if (middleSectionContainer) {
            middleSectionContainer.appendChild(middleSection);
        } else {
            console.error("Nu s-a găsit containerul #middle-section");
            return;
        }
    }
    
    middleSection.innerHTML = "";
    middleSection.style.display = "block";

    createQuiz(middleSection, quizId);
}

document.addEventListener("DOMContentLoaded", function() {

    document.querySelectorAll(".quiz-item").forEach(function(quizItem) {
        const quizId = quizItem.getAttribute("data-quiz-id");
        quizItem.addEventListener("click", function(event) {
            event.stopPropagation();
            selectQuiz(quizId);
        });
    });
});

function createQuiz(middleSection, quizId) {

    const questionInput = document.createElement("input");
    questionInput.classList.add("question-input");
    questionInput.type = "text";
    questionInput.placeholder = "Adauga aici intrebarea...";
    questionInput.style.width = "100%";
    questionInput.style.marginBottom = "10px";
    middleSection.appendChild(questionInput);

    const answerContainer = document.createElement("div");
    answerContainer.classList.add("answer-container");
    middleSection.appendChild(answerContainer);

    const addAnswerButton = document.createElement("button");
    addAnswerButton.textContent = "Adauga raspuns";
    addAnswerButton.classList.add("btn", "add-answer-btn");

    addAnswerButton.addEventListener("click", function() {
        addAnswer(answerContainer);
    });
    middleSection.appendChild(addAnswerButton);

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("quiz-button-container");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.marginTop = "20px";

    const saveQuizBtn = document.createElement("button");
    saveQuizBtn.textContent = "Salveaza quiz";
    saveQuizBtn.classList.add("btn", "save-quiz-btn");
    saveQuizBtn.addEventListener("click", function() {
        saveQuiz(quizId);
    });
    buttonContainer.appendChild(saveQuizBtn);

    const deleteQuizBtn = document.createElement("button");
    deleteQuizBtn.textContent = "Sterge quiz";
    deleteQuizBtn.classList.add("btn", "delete-quiz-btn");
    deleteQuizBtn.addEventListener("click", function() {
        deleteQuiz(quizId);
    });
    buttonContainer.appendChild(deleteQuizBtn);

    middleSection.appendChild(buttonContainer);

    getQuizContent(quizId, middleSection);
}


function addAnswer(answerContainer, text="", isCorrect=false, answerId=null) {

    const answerDiv = document.createElement("div");
    answerDiv.classList.add("answer-div");
    answerDiv.style.marginBottom = "10px";
    answerDiv.style.display = "flex";
    answerDiv.style.alignItems = "center";


    if (answerId) {
        answerDiv.setAttribute("data-answer-id", answerId);
    }

    const answerInput = document.createElement("input");
    answerInput.type = "text";
    answerInput.placeholder = "Adauga raspuns";
    answerInput.value = text;
    answerInput.classList.add("answer-input");
    answerInput.style.width = "60%";
    answerDiv.appendChild(answerInput);

    const correctCheckbox = document.createElement("input");
    correctCheckbox.type = "checkbox";
    correctCheckbox.checked = isCorrect;
    correctCheckbox.classList.add("correct-checkbox");
    correctCheckbox.style.marginLeft = "10px";
    answerDiv.appendChild(correctCheckbox);

    const correctLabel = document.createElement("label");
    correctLabel.textContent = "Corect";
    correctLabel.style.marginLeft = "5px";
    answerDiv.appendChild(correctLabel);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Sterge";
    deleteButton.classList.add("btn", "delete-btn");
    deleteButton.style.marginLeft = "10px";
    deleteButton.addEventListener("click", function() {
    
    const answerId = answerDiv.getAttribute("data-answer-id");
    
    if (answerId) {
        deleteAnswer(answerId, answerDiv);
    } else {
        answerDiv.remove();
    }
    });
    answerDiv.appendChild(deleteButton);

    answerContainer.appendChild(answerDiv);
}

function deleteAnswer(answerId, answerDiv) {
    fetch(`/teacher_dashboard/quiz/answer/${answerId}/delete/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            answerDiv.remove();
        } else {
            console.error("Eroare la stergerea raspunsului: ", data.error);
        }
    })
    .catch(error => {
        console.error("Eroare: ", error);
    });
}


function getQuizContent(quizId, middleSection) {
    fetch(`/teacher_dashboard/quiz/${quizId}/content/`)
    .then(response => response.json())
    .then(data => {
        console.log("Am primit despre quiz: ", data);
        if (data.success) {

            const questionInput = middleSection.querySelector(".question-input");
            if (data.quiz.questions && data.quiz.questions.length > 0) {
                questionInput.value = data.quiz.questions[0].text;

                const answerContainer = middleSection.querySelector(".answer-container");
                data.quiz.questions[0].answers.forEach(answer => {
                    addAnswer(
                        answerContainer, 
                        answer.text, 
                        answer.is_correct,
                        answer.id
                    );
                });
            } else {
                console.log("Quiz-ul nu are intrebari.");
            }
        } else {
            console.error("Eroare: ", data.error);
        }
    })
    .catch(error => {
        console.error("Eroare: ", error);
    });
}

function saveQuiz(quizId) {

    const middleSection = document.querySelector(`.middle[data-quiz-id='${quizId}']`);

    const questionText = middleSection.querySelector('.question-input').value;

    if (!questionText.trim()) {
        alert("Trebuie sa introduci o intrebare.");
        return;
    }

    const answers = [];
    middleSection.querySelectorAll('.answer-div').forEach(answerDiv => {
        const answerInput = answerDiv.querySelector('.answer-input');
        if (!answerInput) return;

        const answerText = answerInput.value;
        const isCorrect = answerDiv.querySelector('.correct-checkbox').checked;
        const answerId = answerDiv.getAttribute('data-answer-id');

        if (answerText.trim()) {
            answers.push({
                id: answerId,
                text: answerText,
                is_correct: isCorrect
            });
        }
    });

    if (answers.length === 0) {
        alert("Trebuie sa introduci cel putin un raspuns.");
        return;
    }

    const correctAnswers = answers.some(answer => answer.is_correct);
    if (!correctAnswers) {
        alert("Trebuie sa marchezi cel putin un raspuns corect.");
        return;
    }

    const quizData = {
        question: questionText,
        answers: answers
    };
    
    fetch(`/teacher_dashboard/quiz/${quizId}/save_quiz/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify(quizData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Quiz-ul a fost salvat cu succes.");
            
            if (data.data && data.data.answers) {
                const newAnswers = middleSection.querySelectorAll('.answer-div:not([data-answer-id])');
                data.data.answers.forEach((answer, index) => {
                    if (index < newAnswers.length) {
                        newAnswers[index].setAttribute('data-answer-id', answer.id);
                    }
                });
            }
        } else {
            alert("Eroare la salvarea quiz-ului.");
            console.error("Eroare: ", data.error);
        }
    })
    .catch(error => {
        console.error("Eroare: ", error);
        alert("Eroare la conexiunea cu serverul.");
    });
}

function deleteQuiz(quizId) {
    if (!confirm("Ești sigur că vrei să ștergi acest quiz?")) {
        return;
    }
    
    fetch(`/teacher_dashboard/quiz/${quizId}/delete/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {

            const quizItem = document.querySelector(`[data-quiz-id='${quizId}']`);
            if (quizItem) {
                quizItem.remove();
            }
            
            const middleSection = document.querySelector(`.middle[data-quiz-id='${quizId}']`);
            if (middleSection) {
                middleSection.style.display = "none";
            }
            
            alert("Quiz-ul a fost sters cu succes.");
        } else {
            console.error("Eroare: ", data.error);
            alert("Eroare la stergerea quiz-ului.");
        }
    })
    .catch(error => {
        console.error("Eroare: ", error);
        alert("Eroare la conexiunea cu serverul.");
    });
}