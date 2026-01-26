let startTime; 
let endTime;  
let minutes;  
let seconds; 
let restartTime;  
let timeDiff;   

function startTimer() {
    startTime = new Date();
}


function endTimer() {
    endTime = new Date();
    timeDiff = endTime - startTime;
    minutes = Math.floor(timeDiff/60000); 
    seconds = Math.floor((timeDiff % 60000) / 1000);  
}


function restartTimer() {
    startTime = new Date(new Date().getTime() - timeDiff);
}


let selectedDifficulty = null;
let selectedLanguage = null;


function selectLanguage(language) {
    selectedLanguage = language;

    console.log("limbaj primit in fct 1: ", language, selectedLanguage);

    document.getElementById("step-1").style.display = "none";
    document.getElementById("step-2").style.display = "block";  
    
 }

function selectDifficulty(difficulty) {
    selectedDifficulty = difficulty
    document.getElementById("step-2").style.display = "none";

    console.log("dificultate primits in fct2: ", difficulty, selectedDifficulty);

    loadExercise();

}


function loadExercise() {
    fetch(`/get_random_exercise?language=${selectedLanguage}&difficulty=${selectedDifficulty}`)
    .then(response => response.json())
    .then(data =>{
        console.log("am intrat 1");

        exerciseId = data.id;
        console.log(exerciseId);

        document.getElementById("exercise-title").innerText = data.title;
        document.getElementById("exercise-description").innerText = data.description;
        document.getElementById("step-3-container").style.display = "flex";
        
        codeMirrorInput();
        startTimer();
        overlay.style.display = "none";


    });
}

var editor = null;

function codeMirrorInput() {
    if(editor) {
        console.log("edior deja initializat");
        editor.setValue("");
        return;
    }

    var referenceSolution = document.getElementById("id-reference-solution");
    referenceSolution.style.display = "flex";
    console.log("am intrat 2");

    if (referenceSolution) {

        console.log("am intrat 3");
        editor = CodeMirror.fromTextArea(referenceSolution, {
            lineNumbers: true,
            mode: "python", 
            theme: "ayu-mirage",
            indentUnit: 4,
            tabSize: 4,
            matchBrackets: true,
            autoCloseBrackets: true,
        });

        if (selectedLanguage) {
            addEventListener("change", function () {
                if(selectedLanguage){
                   selectedLanguage  = this.value.toLowerCase();
                }
                var mode = {
                    python: "python",
                    java: "text/x-java",
                    php: "application/x-httpd-php",
                }[selectedLanguage] || "text/plain";

                editor.setOption("mode", mode);
            });
        }
    }
}


const verifyAnswerButton = document.getElementById("verify-answer");

if(verifyAnswerButton) {
    verifyAnswerButton.addEventListener("click", validateExercise);
}

async function validateExercise(event) {
    event.preventDefault();
    console.log(exerciseId);

    const sendData = {  
        exercise_id: exerciseId,
        programming_language: selectedLanguage,
        proposed_solution: editor.getValue(),
    }

    console.log("Sending request...");

    endTimer();

    try {
        const response = await fetch('/verify_solution/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify(sendData)
        });

        const responseData = await response.json();

        console.log("Received response:", responseData);

        if (!response.ok) {
            createErrorDiv(responseData.error, responseData.details);
            return;
        }

        if (responseData.success) {
            console.log("All good");
            
            createCongratsDiv(responseData);
        }
        else {
            console.log("Smth bad");
            console.table(responseData);

            createWrongDiv(responseData);
        }
    } catch (error) {
            console.error("Validation failed:", error);
            createErrorDiv("Netwoek Error", error.message);

        }
    }


function createCongratsDiv(responseData) {
    console.log("aici div 1");

    const overlay = document.getElementById("overlay");
    overlay.style.display = "block";

    document.getElementById("verify-answer").style.display = "none";
    congratsDiv = document.createElement("div");
    congratsDiv.id = "congrats-div";
    document.getElementById("step-3").style.height = "330px";
    congratsDiv.style.top = "calc(100%)";

    let message = `<h3><p>Felicitari, solutia ta a trecut toate testele.</p></h3>`;

    message += `<h4>Cazurile de testare luate in calcul:</h4><ul>`;
    responseData.test_cases.forEach(tc => {
        let passedIcon = `<span class="correct-icon"></span>`;
        message += `<li class="test-case">Input: [${tc.input.replace(/\s+/g, ', ')}] → Expected output: [${tc.expected_output}] → Your output: [${tc.actual_output}] ${passedIcon}</li>`;
    });
    message += `</ul>`;

    message += `<p>Timp de rezolvare: ${minutes}min ${seconds}sec.</p>`;
    congratsDiv.innerHTML = message;
    document.getElementById("step-3").appendChild(congratsDiv);

    let anotherExercise = document.createElement("span");
    anotherExercise.id = "another-exercise";
    anotherExercise.innerText = "[Incearca alt exercitiu]";

    anotherExercise.addEventListener("click", function() {
        document.getElementById("step-3").style.height = "600px";
        congratsDiv.remove();
        verifyAnswerButton.style.display = "block";
        loadExercise();
    })

    congratsDiv.appendChild(anotherExercise);

}


function createWrongDiv(responseData) {
    console.log("aici div 2");

    const overlay = document.getElementById("overlay");
    overlay.style.display = "block";

    document.getElementById("verify-answer").style.display = "none";
    wrongDiv = document.createElement("div");
    wrongDiv.id = "wrong-div";
    document.getElementById("step-3").style.height = "330px";
    wrongDiv.style.top = "calc(100%)";

    let message = `<h3><p>Gresit, solutia ta nu a trecut toate testele.</p></h3>`;
    
    message += `<h4>Cazurile de testare luate in calcul:</h4><ul>`;
    responseData.test_cases.forEach(tc => {
        let wrongIcon = tc.passed ?  `<span class="correct-icon"></span>` :`<span class="wrong-icon"></span>`;
        message += `<li class="test-case">Input: [${tc.input.replace(/\s+/g, ', ')}] -> Expected output: [${tc.expected_output}] -> Your output: [${tc.actual_output}] ${wrongIcon}</li>`;
    });
    message += `</ul>`;

    message += `<p>Timp de rezolvare: ${minutes}min ${seconds}sec.</p>`;
    wrongDiv.innerHTML = message;
    document.getElementById("step-3").appendChild(wrongDiv);

    let tryAgain = document.createElement("span");
    tryAgain.id = "try-exercise-again";
    tryAgain.innerText = "[Incearca din nou]";

    tryAgain.addEventListener("click", function() {
        document.getElementById("step-3").style.height = "600px";
        restartTimer();
        document.getElementById("verify-answer").style.display = "block";
        document.getElementById("wrong-div").remove();
        overlay.style.display = "none";

    })

    wrongDiv.appendChild(tryAgain);

    let anotherExercise = document.createElement("span");
    anotherExercise.id = "another-exercise-w";
    anotherExercise.innerText = "[Incearca alt exercitiu]";

    anotherExercise.addEventListener("click", function() {
        document.getElementById("step-3").style.height = "600px";
        wrongDiv.remove();
        verifyAnswerButton.style.display = "block";
        loadExercise();
    })

    wrongDiv.appendChild(anotherExercise);
}


function createErrorDiv(errorType, details) {
    console.log("aici div 3");

    const overlay = document.getElementById("overlay");
    overlay.style.display = "block";

    document.getElementById("verify-answer").style.display = "none";
    let errorDiv = document.createElement("div");
    errorDiv.id = "error-div";
    document.getElementById("step-3").style.height = "330px";
    errorDiv.style.top = "calc(100%)";

    let message = `<h3><p>${errorType}</p></h3>`;
    if (details && details !== "undefined") {
        message += `<p>Detalii: <pre>${details}</pre></p>`;
    } else {
        message += `<p>Nu sunt disponibile detalii suplimentare.</p>`;
    }

    errorDiv.innerHTML = message;
    document.getElementById("step-3").appendChild(errorDiv);

    let tryAgain = document.createElement("span");
    tryAgain.id = "try-exercise-again";
    tryAgain.innerText = "[Incearca din nou]";

    tryAgain.addEventListener("click", function () {
        overlay.style.display = "none";
        document.getElementById("step-3").style.height = "600px";
        errorDiv.remove();
        restartTimer();
        verifyAnswerButton.style.display = "block";

    });

    errorDiv.appendChild(tryAgain);

    let anotherExercise = document.createElement("span");
    anotherExercise.id = "another-exercise-w";
    anotherExercise.innerText = "[Incearca alt exercitiu]";

    anotherExercise.addEventListener("click", function () {
        document.getElementById("step-3").style.height = "600px";
        errorDiv.remove();
        verifyAnswerButton.style.display = "block";
        loadExercise();
    });

    errorDiv.appendChild(anotherExercise);
}


document.addEventListener("DOMContentLoaded", function () {
    const backToStep1 = document.getElementById("back-to-step-1");
    const backToStep2 = document.getElementById("back-to-step-2");

    if(backToStep1) {
        backToStep1.addEventListener("click", function () {
            document.getElementById("step-2").style.display = "none";
            document.getElementById("step-1").style.display = "block";
        })
    }

    if(backToStep2) {
        backToStep2.addEventListener("click", function () {
            document.getElementById("step-3-container").style.display = "none";
            document.getElementById("step-2").style.display = "block";
        })
    }

})



