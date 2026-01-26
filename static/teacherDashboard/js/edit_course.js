let editors = [];
let divCounter = 0; // Counter pentru ID-uri unice
let editor; // Va fi inițializat mai târziu

document.addEventListener('DOMContentLoaded', function () {
    const middle = document.getElementsByClassName('middle')[0];
    editor = document.createElement('div'); // Creăm un container principal care să aibă doar editor-div-uri
    editor.id = 'editor-container';
    middle.appendChild(editor); // Adăugăm editorul în secțiunea middle

    // Creează primul div de tip editor-div
    createEditorDiv();

    // Adăugare nou div dinamic la apăsarea Enter în orice editor-div
    document.addEventListener('keydown', function (event) {
        if (event.target.classList.contains('editor-div') && event.key === 'Enter') {
            event.preventDefault(); // Previne comportamentul implicit (linie nouă)
            createEditorDiv(); // Crează un nou editor-div
        }
    });
});

// Funcție pentru a crea un nou div de tip editor-div
function createEditorDiv() {
    divCounter++;
    const newDiv = document.createElement('div');
    newDiv.className = 'editor-div';
    newDiv.setAttribute('contentEditable', 'true');
    newDiv.setAttribute('data-placeholder', 'Write something...');
    newDiv.id = `editor-div-${divCounter}`; // ID unic pentru fiecare div

    // Stilizare div pentru a fi centrat și a nu avea indentări suplimentare
    newDiv.style.position = 'relative'; // Poziționare relativă pentru iconul de meniu
    newDiv.style.margin = '10px 0'; // Eliminare margini mari
    newDiv.style.padding = '10px'; // Spațiu intern uniform
    newDiv.style.minHeight = '50px'; // O înălțime minimă pentru a putea fi vizibil
    newDiv.style.display = 'flex'; // Flex pentru a alinia elementele
    newDiv.style.alignItems = 'left'; // Aliniere pe verticală
    newDiv.style.justifyContent = 'left'; // Centrare pe orizontală
    newDiv.style.marginLeft = '50px';

    // Verificăm dacă există un Quill activ și obținem div-ul său
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    const currentDiv = activeEditor ? activeEditor.root.closest('.editor-div') : null;

    if (currentDiv && currentDiv.nextSibling) {
        editor.insertBefore(newDiv, currentDiv.nextSibling);
    } else if (currentDiv) {
        editor.appendChild(newDiv);
    } else {
        editor.appendChild(newDiv); // Fallback, dacă nu există div activ
    }


    // Instanțiază Quill pe noul div
    const quillInstance = new Quill(newDiv, {
        modules: {
            toolbar: false, // Elimină bara de instrumente implicită
            imageResize: {},
            videoResize: {}, // dacă folosești un modul pentru redimensionarea videoclipurilor
            clipboard: {
                matchVisual: false // opțiune necesară pentru a face embed-uri de imagini
            }
        },
        theme: null // Poți alege tema dorită
    });

    editors.push(quillInstance); // Stochează referința la editor

    applyEditorDivProperties(newDiv);

    // Plasează cursorul în noul div
    setCursorToEnd(newDiv);


}

// Funcție pentru a aplica proprietățile editor-div
function applyEditorDivProperties(div) {
    createContextMenu(div);

    // Placeholder vizibil doar când div-ul este focusat
    div.addEventListener('focus', function () {
        if (!div.innerText.trim()) {
            div.classList.add('show-placeholder');
        }
    });

    div.addEventListener('blur', function () {
        div.classList.remove('show-placeholder');
    });
}

function setCursorToEnd(element) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false); // Cursorul la sfârșit
    selection.removeAllRanges();
    selection.addRange(range);
    element.focus(); // Focus pe noul div
}

// Creare meniu contextual
function createContextMenu(div) {
    if (!div.querySelector('.context-menu')) {
        const menuIcon = document.createElement('img');
        menuIcon.src = "/static/teacherDashboard/images/menu.png";
        menuIcon.width = 30;
        menuIcon.alt = 'Menu';
        menuIcon.style.position = 'absolute';
        menuIcon.style.left = '-45px';
        menuIcon.style.top = '10px';
        menuIcon.style.cursor = 'pointer';
        menuIcon.style.display = 'none'; // Inițial ascuns

        // Evenimente pentru a arăta/ascunde menuIcon când mouse-ul e pe imagine
        div.addEventListener('mouseenter', function () {
            menuIcon.style.display = 'block'; // Afișează iconița când mouse-ul intră pe div
        });

        div.addEventListener('mouseleave', function () {
            setTimeout(function () {
                if (!menuIcon.matches(':hover')) {
                    menuIcon.style.display = 'none'; // Ascunde iconița dacă mouse-ul nu e peste ea
                }
            }, 100);  // Întârziere mică pentru a preveni dispariția imediată
        });

        div.appendChild(menuIcon);

        // Creare meniu contextual
        const menu = document.createElement('div');
        menu.classList.add('context-menu');
        menu.style.display = 'none'; // Ascuns implicit
        menu.innerHTML = `
        <ul>
            <li onclick="deleteElement(this)">Delete</li>
        </ul>`;
        div.appendChild(menu);

        // Afișează/ascunde meniul contextual la click pe icon
        menuIcon.addEventListener('click', function () {
            const menu = div.querySelector('.context-menu');
            if (menu) {
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }
        });
    }
}

// Șterge div-ul la click
window.deleteElement = function (elem) {
    const divToDelete = elem.closest('.editor-div');
    const editorContainer = document.getElementById('editor-container');

    if (divToDelete && editorContainer.childElementCount > 1) {
        divToDelete.remove();
    }
};


// Funcționalitate drag-and-drop pe imaginea meniului
let draggedDiv = null;

document.addEventListener('dragstart', function (e) {
    if (e.target && e.target.tagName === 'IMG') {
        draggedDiv = e.target.closest('.editor-div'); // Doar div-ul părinte este mutat
    }
});

document.addEventListener('dragover', function (e) {
    e.preventDefault(); // permite drop-ul, comportamentul implicit al browser-ului blocheaza plasarea drop a el.
    const dropZone = e.target.closest('.editor-div'); //celmai apropiat el. cu cl. editor-div
    if (dropZone && dropZone !== draggedDiv) {
        const rect = dropZone.getBoundingClientRect(); //returneaza un ob. care contine dimensiunile si poz. rel. a div-ului tinta
                                                       // fata de viewport (unde anume in div-ul tinta se afla cursorul)
        if (e.clientY < rect.top + rect.height / 2) { //(coordonata vert a cutsorului (y) in mom. ev.) < (mjl. div-ului tinta)
            //verifica daca aceasta coordonata e mai sus sau mai jos de mijlocul div-ului tinta
            dropZone.classList.add('drag-over-top'); //daca y e mai mica inseamna ca e el. tras trebuie plasat deasupra div-ului tinta
            dropZone.classList.remove('drag-over-bottom');
        } else {                                     //altfel, trebuie plasat mai jos
            dropZone.classList.add('drag-over-bottom');
            dropZone.classList.remove('drag-over-top');
        }
    }
});

document.addEventListener('dragleave', function (e) {
    const dropZone = e.target.closest('.editor-div');
    if (dropZone) {
        dropZone.classList.remove('drag-over-top', 'drag-over-bottom');
    }
});

document.addEventListener('drop', function (e) {
    e.preventDefault();
    const dropZone = e.target.closest('.editor-div');
    if (dropZone && draggedDiv && dropZone !== draggedDiv) {
        const editor = document.getElementById('editor-container');
        const rect = dropZone.getBoundingClientRect();
        dropZone.classList.remove('drag-over-top', 'drag-over-bottom');

        if (e.clientY < rect.top + rect.height / 2) {
            editor.insertBefore(draggedDiv, dropZone);
        } else {
            editor.insertBefore(draggedDiv, dropZone.nextSibling);
        }
    }
    draggedDiv = null;
});


//-------------left-------------------

    function addChapter() {
    // Creează câmpul de input pentru titlul capitolului
    var newChapterInput = document.createElement("input");
    newChapterInput.type = "text";
    newChapterInput.placeholder = "Add chapter title";
    newChapterInput.classList.add("form-control", "mt-2");

    // Adaugă event listener pentru salvare automată când pierzi focusul (blur)
    newChapterInput.addEventListener('blur', function() {
    var chapterTitle = newChapterInput.value;
    if (chapterTitle.trim() !== "") {
        saveChapter(chapterTitle);  // Salvează automat dacă titlul nu este gol
    } else {
        alert("Chapter title cannot be empty!");
    }

    // Elimină input-ul după ce utilizatorul a apăsat în afara lui
    newChapterInput.remove();
});


    // Adaugă input-ul în lista din stânga
    var chapterList = document.getElementById("chapter-list");
    chapterList.appendChild(newChapterInput);

    // Dă focus imediat pe noul câmp de input
    newChapterInput.focus();
}


function saveChapter(chapterTitle) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    fetch(addChapterUrl, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            title: chapterTitle
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            var chapterList = document.getElementById("chapter-list");

            var chapterContainer = document.createElement("div");
            chapterContainer.classList.add("chapter-container");
            chapterContainer.setAttribute('data-chapter-id', data.chapter_id);

            var newChapter = document.createElement("strong");
            newChapter.textContent = data.chapter_title;

            var subList = document.createElement("ul");
            subList.classList.add("list-group", "mt-2");

            var chapterListItem = document.createElement("li");
            chapterListItem.classList.add("list-group-item");
            chapterListItem.appendChild(newChapter);
            chapterListItem.appendChild(subList);

            chapterContainer.appendChild(chapterListItem);

            // Adaugă capitolul la finalul listei
            chapterList.appendChild(chapterContainer);

            enableEditChapterTitle(chapterContainer, data.chapter_id);

            // Aplică toggleDeleteButtonOnHover imediat după adăugarea capitolului
            toggleDeleteButtonOnHover(chapterContainer, data.chapter_id);

            newChapter.addEventListener('click', function () {
                selectChapter(data.chapter_id);  // Apelează funcția pentru a selecta capitolul
                toggleDeleteButtonOnHover(chapterContainer, data.chapter_id); // Adaugă funcția care creează butonul delete
            });
        } else {
            alert("Error adding chapter.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}


       // stergerea capitolelelor statice
document.addEventListener('DOMContentLoaded', function() {
    var chapters = document.querySelectorAll('.chapter-container strong');  // Selectează toate capitolele
    chapters.forEach(function(chapter) {
        var chapterContainer = chapter.closest('.chapter-container');  // Accesează corect containerul capitolului
        var chapterId = chapterContainer.getAttribute('data-chapter-id');  // Preia id-ul capitolului din container
        if (chapterId) {
            chapter.addEventListener('click', function() {
                toggleDeleteButtonOnHover(chapterContainer, chapterId);  // Apelează funcția care adaugă butonul delete
            });
        }
    });
});


function toggleDeleteButtonOnHover(chapterContainer, chapterId) {
    // Selectează titlul capitolului
    var chapterTitle = chapterContainer.querySelector("strong");

    // Verifică dacă butonul delete există deja
    var existingDeleteButton = chapterContainer.querySelector(".delete-button");
    if (existingDeleteButton) {
        return; // Dacă există deja, nu mai adăuga un alt buton
    }

    // Crează butonul delete
    var deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("btn", "btn-danger", "btn-sm", "delete-button");
    deleteButton.style.display = "none";  // Ascunde inițial butonul

    deleteButton.addEventListener('click', function () {
        showConfirmationDialog(() => {
            deleteChapter(chapterId, chapterContainer);
        });
    });

    // Adaugă butonul delete imediat după titlul capitolului
    chapterTitle.parentNode.insertBefore(deleteButton, chapterTitle.nextSibling);

    // Afișează butonul când cursorul este peste titlu sau buton
    chapterTitle.addEventListener('mouseover', function () {
        deleteButton.style.display = "inline-block"; // Arată butonul
    });
    deleteButton.addEventListener('mouseover', function () {
        deleteButton.style.display = "inline-block"; // Asigură că butonul rămâne vizibil dacă mutăm cursorul pe el
    });

    // Ascunde butonul când cursorul părăsește titlul și butonul
    chapterTitle.addEventListener('mouseout', function () {
        setTimeout(function () {
            if (!deleteButton.matches(':hover')) { // Verifică dacă cursorul nu este deasupra butonului
                deleteButton.style.display = "none";
            }
        }, 200); // Mică întârziere pentru a permite cursorului să se mute pe buton
    });
    deleteButton.addEventListener('mouseout', function () {
        deleteButton.style.display = "none"; // Ascunde butonul când părăsești butonul
    });
}



// Aplică funcția pentru fiecare capitol
document.addEventListener('DOMContentLoaded', function () {
    var chapters = document.querySelectorAll('.chapter-container');
    chapters.forEach(function (chapterContainer) {
        var chapterId = chapterContainer.getAttribute('data-chapter-id');
        toggleDeleteButtonOnHover(chapterContainer, chapterId);
    });
});


function showConfirmationDialog(onConfirm) {
    // Verifică dacă dialogul există deja
    var existingDialog = document.querySelector(".alert-warning");
    if (existingDialog) {
        return;  // Dacă există deja, nu mai adăuga unul nou
    }

    // Creează un div pentru dialogul de confirmare
    var confirmationDialogue = document.createElement("div");
    confirmationDialogue.classList.add("alert", "alert-warning", "alert-dismissible", "fade", "show");
    confirmationDialogue.setAttribute("role", "alert");
    confirmationDialogue.style.position = "fixed"; // Poziționează-l fix
    confirmationDialogue.style.top = "20px"; // La începutul paginii
    confirmationDialogue.style.left = "50%"; // Centrul pe orizontală
    confirmationDialogue.style.transform = "translateX(-50%)"; // Centrarea pe orizontală

    // Creează mesajul de confirmare
    var message = document.createElement("span");
    message.textContent = "Are you sure you want to delete this chapter? It will automatically delete also your subchapters.";
    confirmationDialogue.appendChild(message);

    // Creează butoanele Yes și No
    var yesButton = document.createElement("button");
    yesButton.textContent = "Yes";
    yesButton.classList.add("btn", "btn-danger", "mx-2", "btn-sm");

    var noButton = document.createElement("button");
    noButton.textContent = "No";
    noButton.classList.add("btn", "btn-secondary", "mx-2", "btn-sm");

    // Event listener pentru butonul Yes
    yesButton.addEventListener("click", function () {
        confirmationDialogue.remove();  // Elimină dialogul
        onConfirm();  // Apelează funcția de confirmare
    });

    // Event listener pentru butonul No
    noButton.addEventListener("click", function () {
        confirmationDialogue.remove();  // Elimină dialogul fără a face nimic
    });

    // Adaugă butoanele în dialog
    confirmationDialogue.appendChild(yesButton);
    confirmationDialogue.appendChild(noButton);

    // Adaugă dialogul în body la început
    document.body.prepend(confirmationDialogue);
}




// functie pt stergerea capitolului din bk si DOM
function deleteChapter(chapterId, chapterContainer) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const deleteUrl = deleteChapterUrl.replace('0', chapterId);

    // trimite un request catre bk pt a sterge capitoul
    fetch(deleteUrl,{
        method: "DELETE",
        headers: {
            'X-CSRFToken':  csrfToken ,
        },
    })
    .then(response =>{
        if(!response.ok){
            throw new Error('Network response was not ok');
    }
        return response.json();
    })
    .then(data => {
        if(data.success) {
            chapterContainer.remove();
        }
        else{
            alert("Error deleting the chapter!");
        }
    })
}


// modificarea titlurilor
document.addEventListener('DOMContentLoaded', function() {
    // Selectăm toate titlurile de capitol
    var chapters = document.querySelectorAll('.chapter-container');
    // Aplicăm funcția enableEditChapterTitle pentru fiecare capitol
    chapters.forEach(function(chapterContainer) {
        var chapterId = chapterContainer.getAttribute('data-chapter-id');
        enableEditChapterTitle(chapterContainer, chapterId);
    });
});

function enableEditChapterTitle(chapterContainer, chapterId) {
    // Selectăm elementul <li> care conține titlul capitolului
    let liElement = chapterContainer.querySelector("li");
    let titleElement = liElement.querySelector("strong");  // Accesăm titlul capitolului

    // Adăugăm event listener la dublu click
    titleElement.addEventListener("dblclick", function () {
        // Creăm un câmp de input pentru editarea titlului
        let editInput = document.createElement("input");
        editInput.type = "text";
        editInput.value = titleElement.textContent;
        editInput.classList.add("form-control", "mt-2");

        // Înlocuim titlul cu câmpul de input
        liElement.replaceChild(editInput, titleElement);

        // Focus pe input pentru a putea edita imediat
        editInput.focus();

        // Event listener pentru când utilizatorul termină de editat
        // Prima situație: când apasă în afara casetei
        editInput.addEventListener("blur", function () {
            saveEditedChapterTitle(chapterId, editInput.value, liElement, titleElement);
        });
        // A doua situație: când apasă pe enter
        editInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                saveEditedChapterTitle(chapterId, editInput.value, liElement, titleElement);
            }
        });
    });
}

function saveEditedChapterTitle(chapterId, newTitle, liElement, titleElement) {
    if (newTitle.trim() === "") {
        alert("Chapter title cannot be empty!");
        return;
    }

    // Preluăm token-ul CSRF din meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const updateUrl = updateChapterUrl.replace('0', chapterId);

    // Trimitem cererea pentru actualizarea titlului
    fetch(updateUrl, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            title: newTitle
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Actualizăm titlul capitolului în interfață
            titleElement.textContent = newTitle;
            liElement.replaceChild(titleElement, liElement.querySelector("input"));
        } else {
            alert("The title couldn't be updated! Error!");
        }
    });
}

//------focus capitole/ subcapitole/
let selectedChapterId = null;
let selectedSubchapterId = null;

// Functia pentru selectarea capitolelor
function selectChapter(chapterId) {
    // Resetează orice subcapitol selectat
    selectedSubchapterId = null;

    // Găsește elementul capitolului curent și pe cel nou
    var currentChapterElement = selectedChapterId ? document.querySelector(`[data-chapter-id='${selectedChapterId}'] strong`) : null;
    var newChapterElement = document.querySelector(`[data-chapter-id='${chapterId}'] strong`);

    if (!newChapterElement) {
        console.error(`Capitolul cu ID ${chapterId} nu a fost găsit.`);
        return;
    }

    if (currentChapterElement && selectedChapterId === chapterId) {
        // Dacă capitolul este deja selectat, deselectează-l
        currentChapterElement.classList.remove('selected');
        selectedChapterId = null; // Resetează selectedChapterId
    } else {
        // Resetează stilul capitolelor și subcapitolelor anterioare
        document.querySelectorAll('.chapter-container strong').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.subchapter-title').forEach(el => el.classList.remove('selected'));

        // Selectează capitolul curent
        selectedChapterId = chapterId;
        newChapterElement.classList.add('selected');
    }
}



document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.chapter-container strong').forEach(function (chapterElement) {
        var chapterId = chapterElement.closest('.chapter-container').getAttribute('data-chapter-id');
        chapterElement.addEventListener('click', function () {
            selectChapter(chapterId);  // Apelează funcția pentru a selecta capitolul
        });
    });
});


// Event listener pentru click-uri în afara elementelor din clasa .left
document.addEventListener('click', function(event) {
    var leftContainer = document.querySelector('.left');

    // Verifică dacă click-ul a avut loc în afara containerului
    if (leftContainer && !leftContainer.contains(event.target)) {
        // Deselectează orice capitol selectat
        if (selectedChapterId) {
            var currentChapterElement = document.querySelector(`[data-chapter-id='${selectedChapterId}'] strong`);
            if (currentChapterElement) {
                currentChapterElement.classList.remove('selected');
            }
            //selectedChapterId = null; // resetează selectedChapterId
        }
    }
});



function selectSubchapter(subchapterId) {
    // resteaza stilul capitolelor si subcap. anterioare
    document.querySelectorAll('.chapter-title').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.subchapter-title').forEach(el => el.classList.remove('selected'));

    //selecteaza subcap. curent
    selectedSubchapterId = subchapterId;
    var subchapterElement = document.querySelector(`[data-subchapter-id='${subchapterId}']`);
    subchapterElement.classList.add('selected');
}

// -----gestionare subcapitole

function addSubchapter() {
    if (!selectedChapterId) {
        alert("Please select a chapter before adding a subchapter.");
        return;
    }

    console.log("ID-ul capitolului înainte de salvare:", selectedChapterId);  // Afișează selectedChapterId aici

    var newSubchapterInput = document.createElement('input');
    newSubchapterInput.type = 'text';
    newSubchapterInput.placeholder = 'Add subchapter title';
    newSubchapterInput.classList.add('form-control', 'mt-2');

    newSubchapterInput.addEventListener('blur', function () {
        var subchapterTitle = newSubchapterInput.value;
        if (subchapterTitle.trim() !== "") {
            // Apelează saveSubchapter cu selectedChapterId
            saveSubchapter(selectedChapterId, subchapterTitle);
            console.log("Am trimis ID-ul!!!", selectedChapterId);
        } else {
            alert("Subchapter title cannot be empty!");
        }
        newSubchapterInput.remove();
    });

    var chapterContainer = document.querySelector(`[data-chapter-id='${selectedChapterId}']`);

    var subList = chapterContainer.querySelector("ul");
    if (!subList) {
        subList = document.createElement('ul');
        subList.classList.add('list-group', 'mt-2');
        chapterContainer.appendChild(subList);
    }

    subList.appendChild(newSubchapterInput);
    newSubchapterInput.focus();
}




function saveSubchapter(chapterId, subchapterTitle) {
    console.log("Salvăm subcapitolul pentru capitolul ID:", chapterId);

    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const subchapterUrl = `/teacher_dashboard/chapter/${chapterId}/add_subchapter/`;

    let formData = new FormData();
    formData.append('title', subchapterTitle);
    formData.append('chapter', chapterId);

    fetch(subchapterUrl, {
        method: "POST",
        headers: {
            'X-CSRFToken': csrfToken,
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
    if (data.success) {
        var subchapterItem = document.createElement("li");
        subchapterItem.classList.add("list-group-item", "subchapter-item"); // Aplică clasa corectă
        subchapterItem.textContent = data.subchapter_title;
        subchapterItem.setAttribute('data-subchapter-id', data.subchapter_id);
        subchapterItem.style.paddingLeft = '40px';

        // Crează butonul delete
        var deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("btn", "btn-danger", "btn-sm", "delete-button");
        deleteButton.style.display = "none";  // Ascunde inițial butonul

        deleteButton.addEventListener('click', function () {
            showConfirmationDialog(() => {
                deleteSubchapter(data.subchapter_id, subchapterItem);
            });
        });

        // Adaugă butonul delete la subcapitol
        subchapterItem.appendChild(deleteButton);

        // Afișează butonul când cursorul este peste subcapitol
        subchapterItem.addEventListener('mouseover', function () {
            deleteButton.style.display = "inline-block"; // Arată butonul
        });

        // Ascunde butonul când cursorul părăsește subcapitolul
        subchapterItem.addEventListener('mouseout', function () {
            setTimeout(function () {
                if (!deleteButton.matches(':hover')) { // Verifică dacă cursorul nu este deasupra butonului
                    deleteButton.style.display = "none";
                }
            }, 200);
        });

        var chapterContainer = document.querySelector(`[data-chapter-id='${selectedChapterId}']`);
        var subList = chapterContainer.querySelector("ul");
        subList.appendChild(subchapterItem);
    } else {
        alert("Error while adding subchapter!");
        console.error("Form errors:", data.errors);
        alert(`Title Error: ${data.errors.title ? data.errors.title.join(', ') : ''}`);
    }
})



function deleteSubchapter(subchapterId, subchapterElement) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const deleteUrl = `/teacher_dashboard/chapter/${selectedChapterId}/delete_subchapter/${subchapterId}/`; // Actualizează URL-ul

    // Trimite un request pentru a șterge subcapitolul
    fetch(deleteUrl, {
        method: "DELETE",
        headers: {
            'X-CSRFToken': csrfToken,
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            subchapterElement.remove(); // Elimină subcapitolul din DOM
        } else {
            alert("Error deleting the subchapter!");
        }
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}


function toggleDeleteSubchapterButtonOnHover(subchapterElement, subchapterId) {
    // Verifică dacă butonul delete există deja
    var existingDeleteButton = subchapterElement.querySelector(".delete-button");
    if (existingDeleteButton) {
        return; // Dacă există deja, nu mai adăuga un alt buton
    }

    // Crează butonul delete
    var deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("btn", "btn-danger", "btn-sm", "delete-button");
    deleteButton.style.display = "none";  // Ascunde inițial butonul

    deleteButton.addEventListener('click', function () {
        showConfirmationDialog(() => {
            deleteSubchapter(subchapterId, subchapterElement);
        });
    });

    // Adaugă butonul delete la subcapitol
    subchapterElement.appendChild(deleteButton);

    // Afișează butonul când cursorul este peste subcapitol
    subchapterElement.addEventListener('mouseover', function () {
        deleteButton.style.display = "inline-block"; // Arată butonul
    });

    // Ascunde butonul când cursorul părăsește subcapitolul
    subchapterElement.addEventListener('mouseout', function () {
        setTimeout(function () {
            if (!deleteButton.matches(':hover')) { // Verifică dacă cursorul nu este deasupra butonului
                deleteButton.style.display = "none";
            }
        }, 200);
    });
}



document.addEventListener('DOMContentLoaded', function () {
    var subchapters = document.querySelectorAll('.subchapter-item'); // Selectează toate subcapitolele
    subchapters.forEach(function (subchapterElement) {
        var subchapterId = subchapterElement.getAttribute('data-subchapter-id');
        toggleDeleteSubchapterButtonOnHover(subchapterElement, subchapterId); // Apelează noua funcție
    });
});}










//--------------right editor-------------
function italicText() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        const format = activeEditor.getFormat();
        activeEditor.format('italic', !format.italic);
    }
}

function boldText() {
    const activeEditors = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditors) {
        const format = activeEditors.getFormat();
        activeEditors.format('bold', !format.bold);
    }
}

function underlineText() {
    const activeEditors = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditors) {
        const format = activeEditors.getFormat();
        activeEditors.format('underline', !format.underline);
    }
}

function strikethroughText() {
    const activeEditors = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditors) {
        const format = activeEditors.getFormat();
        activeEditors.format('strike', !format.strike);
    }
}

/* aici trebuie sa ma gandesc daca link sau ...
function addLink() {
    const activeEditors = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditors) {
        const format = activeEditors.getFormat();
        activeEditors.format('strike', !format.strike);
    }
}*/

function textFormat() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        const range = activeEditor.getSelection();
        if (range) {
            activeEditor.removeFormat(range.index, range.length);
        }
    }
}

function header1() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('header', 1);
    }
}

function header2() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('header', 2);
    }
}

function header3() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('header', 3);
    }
}

function bulletList() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('list', 'bullet');
    }
}

function numberedList() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('list', 'ordered');
    }
}

function toggleList() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        let format = activeEditor.getFormat();
        if (format.list === 'ordered') {
            activeEditor.format('list', 'bullet');
        } else {
            activeEditor.format('list', 'ordered');
        }
    }
}

function codeFormat() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('code-block', true);
    }
}

function quoteFormat() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('blockquote', true);
    }
}

function callout() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('blockquote', true);
        let format = activeEditor.getFormat();
        if (format.blockquote) {
            activeEditor.format('class', 'ql-callout');
        }
    }
}

function columns2() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        const range = activeEditor.getSelection();
        if (range) {
            activeEditor.clipboard.dangerouslyPasteHTML(range.index, `
                <div style="display: flex;">
                    <div style="width: 50%; padding-right: 10px;">Coloana 1</div>
                    <div style="width: 50%; padding-left: 10px;">Coloana 2</div>
                </div>
            `);
        }
    }
}

function columns3() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        const range = activeEditor.getSelection();
        if (range) {
            activeEditor.clipboard.dangerouslyPasteHTML(range.index, `
                <div style="display: flex;">
                    <div style="width: 33%; padding-right: 10px;">Coloana 1</div>
                    <div style="width: 33%; padding-left: 10px;">Coloana 2</div>
                    <div style="width: 33%; padding-left: 10px;">Coloana 3</div>
                </div>
            `);
        }
    }
}

function columns4() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        const range = activeEditor.getSelection();
        if (range) {
            activeEditor.clipboard.dangerouslyPasteHTML(range.index, `
                <div style="display: flex;">
                    <div style="width: 25%; padding-right: 10px;">Coloana 1</div>
                    <div style="width: 25%; padding-left: 10px;">Coloana 2</div>
                    <div style="width: 25%; padding-left: 10px;">Coloana 3</div>
                    <div style="width: 25%; padding-left: 10px;">Coloana 4</div>
                </div>
            `);
        }
    }
}

function codeText() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        let format = activeEditor.getFormat();
        activeEditor.format('code', !format.code);
    }
}

function uploadImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            let activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));

            // Verificăm dacă există deja alt tip de conținut în div-ul curent
            if (!activeEditor || (!isImageOnly(activeEditor) && activeEditor.root.innerText.trim() !== '')) {
                createEditorDiv(); // Creăm un nou div dacă există conținut text sau alt conținut decât imagini
                activeEditor = editors[editors.length - 1]; // Setăm editorul nou creat ca fiind activ
            }

            const range = activeEditor.getSelection();
            if (range) {
                activeEditor.insertEmbed(range.index, 'image', e.target.result); // Inserează imaginea
            } else {
                activeEditor.insertEmbed(activeEditor.getLength(), 'image', e.target.result); // Inserează la final
            }

            activeEditor.root.setAttribute('contentEditable', 'false'); // Blochează textul în div-ul de imagine
            createEditorDiv(); // Crează un nou div pentru text după imagine
        };
        reader.readAsDataURL(file);
    }
}


function insertTable() {
    let activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));

    // Dacă div-ul curent nu este gol sau conține altceva decât un tabel, creăm un nou div
    if (activeEditor && activeEditor.root.innerHTML.trim() !== '' && !isTableOnly(activeEditor)) {
        createEditorDiv();
        activeEditor = editors[editors.length - 1]; // Setăm editorul nou creat ca fiind activ
    }

    if (activeEditor) {
        const size = document.getElementById('tableSize').value;
        const rows = parseInt(size.split('x')[0]);
        const cols = parseInt(size.split('x')[1]);

        let table = '<table>';
        for (let i = 0; i < rows; i++) {
            table += '<tr>';
            for (let j = 0; j < cols; j++) {
                table += '<td>Cell</td>';
            }
            table += '</tr>';
        }
        table += '</table>';

        const range = activeEditor.getSelection();
        activeEditor.clipboard.dangerouslyPasteHTML(range.index, table);
        activeEditor.root.setAttribute('contentEditable', 'false'); // Blochează textul în div-ul de tabel
        createEditorDiv(); // Crează un nou div pentru text după tabel
    }
}


function uploadVideo(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            let activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));

            // Dacă div-ul curent conține altceva decât un video, creăm un nou div
            if (activeEditor && activeEditor.root.innerHTML.trim() !== '' && !isVideoOnly(activeEditor)) {
                createEditorDiv();
                activeEditor = editors[editors.length - 1]; // Setăm editorul nou creat ca fiind activ
            }

            if (activeEditor) {
                const range = activeEditor.getSelection();
                activeEditor.insertEmbed(range.index, 'video', e.target.result);
                activeEditor.root.setAttribute('contentEditable', 'false'); // Blochează textul în div-ul de video
                createEditorDiv(); // Crează un nou div pentru text după video
            }
        };
        reader.readAsDataURL(file);
    }
}


function isImageOnly(editor) {
    return editor.root.querySelector('img') && editor.root.innerText.trim() === '';
}

function isTableOnly(editor) {
    return editor.root.querySelector('table') && editor.root.innerText.trim() === '';
}

function isVideoOnly(editor) {
    return editor.root.querySelector('video') && editor.root.innerText.trim() === '';
}


function defaultTextColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('color', 'black'); // Negru implicit
    }
}

function greyColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('color', 'grey');
    }
}

function brownColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('color', 'brown');
    }
}

function orangeColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('color', 'orange');
    }
}

function yellowColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('color', 'yellow');
    }
}

function greenColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('color', 'green');
    }
}

function blueColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('color', 'blue');
    }
}

function purpleColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('color', 'purple');
    }
}

function pinkColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('color', 'pink');
    }
}

function redColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('color', 'red');
    }
}


function defaultBackgroundColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('background', 'white'); // Alb implicit pentru fundal
    }
}

function greyBackgroundColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('background', 'grey');
    }
}

function brownBackgroundColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('background', 'brown');
    }
}

function orangeBackgroundColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('background', 'orange');
    }
}

function yellowBackgroundColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('background', 'yellow');
    }
}

function greenBackgroundColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('background', 'green');
    }
}

function blueBackgroundColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('background', 'blue');
    }
}

function purpleBackgroundColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('background', 'purple');
    }
}

function pinkBackgroundColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('background', 'pink');
    }
}

function redBackgroundColor() {
    const activeEditor = editors.find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.format('background', 'red');
    }
}


