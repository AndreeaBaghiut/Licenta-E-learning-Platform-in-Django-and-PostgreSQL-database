document.addEventListener("DOMContentLoaded", function () {
    var referenceSolution = document.getElementById("id_reference_solution");
    if (referenceSolution) {

        editor = CodeMirror.fromTextArea(referenceSolution, {
            lineNumbers: true,
            mode: "python",
            theme: "ayu-mirage",
            indentUnit: 4,
            tabSize: 4,
            matchBrackets: true,
            autoCloseBrackets: true,
        });

        const languageSelector = document.getElementById("id_programming_language");
        if (languageSelector) {
            languageSelector.addEventListener("change", function () {
                var selectedLanguage = this.value.toLowerCase();
                var mode = {
                    python: "python",
                    java: "text/x-java",
                    php: "application/x-httpd-php",
                }[selectedLanguage] || "text/plain";

                editor.setOption("mode", mode);
            });
        }
    }


    const runTestsButton = document.getElementById('run-tests-btn');

    if(runTestsButton) {
        runTestsButton.addEventListener('click', validateExercise);
    }


    async function validateExercise(event) {
        event.preventDefault();

        const testCases = [];
        document.querySelectorAll(".test-case").forEach(testCase => {
            const input_data = testCase.querySelector("textarea[name$='input_data']").value;
            const expected_output = testCase.querySelector("textarea[name$='expected_output']").value;
            if (input_data && expected_output) {
                testCases.push({ input_data, expected_output });
            }
        });

        exerciseId = document.getElementById("exercise-id")?.value || null;
        

        const data = {
            exercise_id: exerciseId,
            programming_language: document.querySelector('#id_programming_language').value,
            reference_solution: editor.getValue(), 
            test_cases: testCases,
            title: document.querySelector('#id_title').value,
            description: document.querySelector('#id_description').value,
            difficulty: document.querySelector('#id_difficulty').value
        };


        try {
            const response = await fetch('/teacher_dashboard/run_tests/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            if (responseData.success) {
                alert("Toate testele au trecut!");
                console.table(responseData.test_results);
                console.log("Se salveaza exercițiul!");
                await saveExercise(data);

                const publishBtn = document.getElementById("publish-btn");
                if (publishBtn) {
                    publishBtn.hidden = false;
                }
                
            } else {
                alert("Cateva teste au picat. Verifica consola pentru mai multe detalii.");
                console.table(responseData.test_results);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    async function saveExercise(data) {
        try {

            if (!data.exercise_id || data.exercise_id === "" || data.exercise_id === "null") {
                console.log("Se trimite un exercițiu nou");
                data.exercise_id = null; 
            } else {
                console.log("editeaza ex:", data.exercise_id);
            }
            
            const response = await fetch('/teacher_dashboard/save_exercise/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value 
                },
                body: JSON.stringify(data)
            });
    
            const responseData = await response.json();
    
            if (responseData.success) {
                console.log("Exercitiul a fost salvat!!!");
                alert("Exercitiul a fost salvat cu succes!");

                window.location.href = responseData.url;
            } else {
                console.error("Exercitiul nu a putut fi salvat: ", responseData.error);
            }
        } catch (error) {
            console.error("Eroare: ", error);
        }
    }
});


function confirmDeletion() {
    return confirm("Sigur vrei sa stergi acest exercitiu?");
}

function publishExercise () {
    const exerciseId = document.getElementById("exercise-id").value;

    fetch(`/teacher_dashboard/exercise/publish_exercise/`, {
        method: "POST",
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'Content-Type': "application/json",
        },
        body: JSON.stringify({exercise_id: exerciseId})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Exercitiul a fost publicat cu succes.");
        }
        else {
            console.error("Eroare in publicarea exercitiului: ", error);
        }
    })
}
