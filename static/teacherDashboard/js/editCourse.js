function addChapter() {

    var newChapterInput = document.createElement("input");
    newChapterInput.type = "text";
    newChapterInput.placeholder = "Add chapter title";
    newChapterInput.classList.add("form-control", "mt-2");

    var save = false;

    newChapterInput.addEventListener("blur", function() {
        if (!save) {
            var chapterTitle = newChapterInput.value;
            if (chapterTitle.trim() != "") {
                saveChapter(chapterTitle);
                save = true;
            }
            else {
                alert ("Titlul capitolului nu poate fi gol!");
            }

            newChapterInput.remove();
        }});

    newChapterInput.addEventListener("keypress", function(event) {
        if(!save) {
            if (event.key === "Enter") {
            var chapterTitle = newChapterInput.value;
            if (chapterTitle.trim() != "") {
            saveChapter(chapterTitle);
            save = true;
            }
            else {
                alert ("Titlul capitolului nu poate fi gol!");
            }

            newChapterInput.remove();
            }
        }
        });

    
    var chapterList = document.getElementById("chapter-list");
    chapterList.appendChild(newChapterInput);

    newChapterInput.focus();
}



function saveChapter(chapterTitle) {
    const courseId = document.getElementById("chapter-list").getAttribute("data-course-id");
    console.log("am trimis titlu: ", chapterTitle, "si id: ", courseId);
    
    fetch(`/teacher_dashboard/edit_course/${courseId}/add_chapter/`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: JSON.stringify({title: chapterTitle})
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {

            var chapterList = document.getElementById("chapter-list");

            var chapterContainer = document.createElement("div");
            chapterContainer.classList.add("chapter-container");
            chapterContainer.setAttribute("data-chapter-id", data.chapter_id);

            var newChapter = document.createElement("strong");
            newChapter.textContent = data.chapter_title;

            var subList = document.createElement("ul");
            subList.classList.add("subchapter-list");

            var chapterListItem = document.createElement("li");
            chapterListItem.classList.add("chapter-item");
            chapterListItem.appendChild(newChapter);
            chapterListItem.appendChild(subList);

            chapterContainer.appendChild(chapterListItem);

            chapterList.appendChild(chapterContainer);

            editChapterTitle(chapterContainer, data.chapter_id);

            deleteButtonOnHover(chapterContainer, data.chapter_id);

            newChapter.addEventListener('click', function () {
                selectChapter(data.chapter_id);
                });

            selectChapter(data.chapter_id);
        }
        
        else {
        alert("Eroare la adaugarea capitolului.")
    }
    })
    .catch(error => {
        console.error("ERROR: ", error);
    })
    
}


function deleteButtonOnHover(chapterContainer, chapter_id) {

    console.log("am apelat btn de stergere");

    var chapterTitle = chapterContainer.querySelector("strong");

    if (!chapterTitle) {
        console.error("Eroare: Nu s-a găsit titlul capitolului în chapterContainer.");
        return;
    }

    var oldDeleteButton = chapterContainer.querySelector(".delete-button");
    if(oldDeleteButton) {
        return;
    }

    var titleContainer = document.createElement("div");
    titleContainer.style.display = "flex";
    titleContainer.style.alignItems = "center";
    titleContainer.style.gap = "10px";

    var titleParent = chapterTitle.parentNode;
    titleParent.insertBefore(titleContainer, chapterTitle);
    titleContainer.appendChild(chapterTitle);

    var deleteButton = document.createElement("button");
    deleteButton.innerHTML = '<img src="/media/site_icons/delete.png" alt="Delete" style="width: 16px; height: 16px;">';
    deleteButton.setAttribute("title", "Sterge capitol.");

    deleteButton.classList.add("btn", "delete-button", "btn-sm");
    deleteButton.style.display = "none";
    deleteButton.style.padding = "2px 6px";
    deleteButton.style.marginLeft = "5px";

    titleContainer.appendChild(deleteButton);

    deleteButton.addEventListener("click", function () {
        showConfirmationDialog(() => {
            deleteChapter(chapter_id, chapterContainer);
        }, true);
    });

    titleContainer.addEventListener("mouseenter", function () {
        deleteButton.style.display = "inline-flex";
    });

    titleContainer.addEventListener("mouseleave", function () {
        deleteButton.style.display = "none";
    });
        
}


function showConfirmationDialog(onConfirm, isChapter=true) {

    var oldDialog = document.querySelector("#confirmation-dialog");
    if(oldDialog) {
        return;
    }

    var confirmationDialog = document.createElement("div");
    confirmationDialog.id = "confirmation-dialog";
    confirmationDialog.classList.add("alert", "alert-warning","alert", "alert-warning", "position-fixed");
    confirmationDialog.setAttribute("role", "alert");

    confirmationDialog.style.top = "50%";
    confirmationDialog.style.left = "50%";
    confirmationDialog.style.transform = "translate(-50%, -50%)";
    confirmationDialog.style.zIndex = "1050";
    confirmationDialog.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
    confirmationDialog.style.padding = "20px";
    confirmationDialog.style.borderRadius = "5px";
    confirmationDialog.style.maxWidth = "400px";

    var message = document.createElement("p");
    message.style.marginBottom = "15px";
    if (isChapter) {
        message.textContent = "Esti sigur ca doresti sa stergi acest capitol? Se vor sterge automat si toate subcapitolele.";
    }
    else {
        message.textContent = "Esti sigur ca doresti sa stergi acest subcapitol?";
    }
    confirmationDialog.appendChild(message);

    var buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.gap = "10px";

    var yesButton = document.createElement("button");
    yesButton.textContent = "Da";
    yesButton.classList.add("btn", "btn-danger", "mx-2", "btn-sm");

    var noButton = document.createElement("button");
    noButton.textContent = "Nu";
    noButton.classList.add("btn", "btn-secondary", "mx-2", "btn-sm");

    yesButton.addEventListener("click", function () {

        confirmationDialog.remove();
        onConfirm();
    });

    noButton.addEventListener("click", function () {
        confirmationDialog.remove();
    });   

    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    confirmationDialog.appendChild(buttonContainer);

    document.body.appendChild(confirmationDialog);

}


function deleteChapter(chapter_id, chapterContainer) {

    console.log("stergem capitolul ", chapter_id);

    let nextToSelect = null;

    const prevChapter = chapterContainer.previousElementSibling;
    if (prevChapter) {
        nextToSelect = prevChapter;
    }
    else {
        const nextChapter = chapterContainer.nextElementSibling;
        if (nextChapter) {
            nextToSelect = nextChapter;
        }
    }

    const nextToSelectId = nextToSelect ? nextToSelect.getAttribute("data-chapter-id") : none;

    console.log("Next chapter to select ", nextToSelectId);

    fetch(`/teacher_dashboard/delete_chapter/${chapter_id}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
    })
    .then(response => {
        if (!response.ok) {
            console.error("Network response was not ok.");
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            chapterContainer.remove();

            if (nextToSelectId) {
                selectChapter(nextToSelectId);
            }
            else {
                document.querySelectorAll(".middle").forEach(section => {
                    section.style.display = "none";
                })
            }
        }
        else {
            alert("Eroare in timpul stergerii capitolului!");
        }
    })
}


document.addEventListener('DOMContentLoaded', function () {
    var chapters = document.querySelectorAll('.chapter-container');
    chapters.forEach(function (chapterContainer) {
        var chapterId = chapterContainer.getAttribute('data-chapter-id');

        deleteButtonOnHover(chapterContainer, chapterId);
    });
});


function editChapterTitle(chapterContainer, chapterId) {
    let liElement = chapterContainer.querySelector("li");
    let titleElement = liElement.querySelector("strong");

    console.log("Eveniment dbl click pe ", titleElement.textContent);

    titleElement.style.cursor = "pointer";

    titleElement.addEventListener("dblclick", function () {
        console.log("dbl click detectat pe ", titleElement.textContent);

        let editInput = document.createElement("input");
        editInput.type = "text";
        editInput.value = titleElement.textContent;
        editInput.classList.add("form-control");
        editInput.style.margin = "5px 0";

        let titleParent = titleElement.parentNode;

        titleElement.style.display = "none";

        titleParent.insertBefore(editInput, titleElement.nextSibling);

        editInput.focus();

        isSaved = false;

        editInput.addEventListener("blur", function () {
            if(!isSaved) {
                isSaved = true;
                saveNewChapterTitle(chapterId, editInput.value, titleElement, editInput);
            }
        });

        editInput.addEventListener("keypress", function(event) {
            if(!isSaved) {
                if (event.key === "Enter") {
                    isSaved = true;
                    saveNewChapterTitle(chapterId, editInput.value, titleElement, editInput);
                }
            }
        });        
    });
}


function saveNewChapterTitle(chapter_id, newTitle, titleElement, editInput) {
    if (newTitle.trim() === "") {
        alert("Noul titlu nu poate fi gol!");
        return;
    }

    fetch(`/teacher_dashboard/update_chapter/${chapter_id}/`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: JSON.stringify({
            title: newTitle
        })
})
    .then(response => response.json())
    .then(data => {
        if(data.success) {

            titleElement.textContent = newTitle;
            titleElement.style.display = "";
            editInput.remove();
        }
        else {
            alert("Titlul nu a putut fi modificat.");
            titleElement.style.display = "";
            editInput.remove();
        }
    });
}


document.addEventListener("DOMContentLoaded", function () {

    var chapters = document.querySelectorAll(".chapter-container");

    chapters.forEach(function (chapterContainer) {
        var chapterId = chapterContainer.getAttribute("data-chapter-id");
        editChapterTitle(chapterContainer, chapterId);
    });
});


function addSubchapter() {
    if(!selectedChapterId) {
        alert("Trebuie sa selectezi un capitol mai intai.");
        return;
    }

    console.log("id capitol: ", selectedChapterId);

    var subchapterInput = document.createElement("input");
    subchapterInput.type = "text";
    subchapterInput.placeholder = "Adauga titlu.";
    subchapterInput.classList.add("form-control", "mt-2");

    var chapterContainer = document.querySelector(`[data-chapter-id='${selectedChapterId}']`);
    var subList = chapterContainer.querySelector("ul");
    if(!subList) {
        subList = document.createElement("ul");
        subList.classList.add("list-group", "mt-2");
        chapterContainer.appendChild(subList);
    }

    subList.appendChild(subchapterInput);
    subchapterInput.focus();

    let isSaved = false;


    subchapterInput.addEventListener("keypress", function (event) {
        if(event.key === "Enter" && !isSaved ) {
            isSaved = true;
            var subchapterTitle = subchapterInput.value;
            if(subchapterTitle.trim() !== "") {
                saveSubchapter(selectedChapterId, subchapterTitle, subchapterInput)
            }
            else {
                alert("Subcapitolul nu a putut fi salvat.");
                subchapterInput.remove();
                isSaved=false;
            }
        }
    }) 

    subchapterInput.addEventListener("blur", function() {
        if(!isSaved ) {
            isSaved = true;
            var subchapterTitle = subchapterInput.value;
            if(subchapterTitle.trim() !== "") {
                saveSubchapter(selectedChapterId, subchapterTitle, subchapterInput)
            }
            else {
                alert("Subcapitolul nu a putut fi salvat.");
                subchapterInput.remove();
                isSaved=false;
            }
        }
    }) 
}



function saveSubchapter(chapterId, subchapterTitle, subchapterInput) {
   fetch(`/teacher_dashboard/chapter/${chapterId}/add_subchapter/`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: JSON.stringify({subchapterTitle: subchapterTitle})
   })
   .then(response => {
    if(!response.ok) {
        console.error("Network response was not ok.");
    }
    return response.json();
   })
   .then(data => {
    if(data.success) {

        if(subchapterInput) {
            subchapterInput.remove();
        }

        var subchapterItem = document.createElement("li");
        subchapterItem.classList.add("list-group-item", "subchapter-item");
        subchapterItem.setAttribute("data-subchapter-id", data.subchapter_id);
        subchapterItem.style.paddingLeft = "40px";

        var subchapterText = document.createElement("span");
        subchapterText.classList.add("subchapter-title");
        subchapterText.textContent = data.subchapter_title;
        subchapterItem.appendChild(subchapterText); 

        var quizList = document.createElement('ul');
        quizList.classList.add('quiz-list');
        quizList.style.listStyleType = 'none';
        quizList.style.paddingLeft = '0';
        quizList.style.marginTop = '5px';
        subchapterItem.appendChild(quizList);


        var chapterContainer = document.querySelector(`[data-chapter-id='${chapterId}']`);
        if (chapterContainer) {
            var subList = chapterContainer.querySelector("ul");
            if (subList) {

            subList.appendChild(subchapterItem);
            console.log("Subcapitol adăugat cu succes în DOM");
            } 
        } 

        subchapterItem.addEventListener('click', function () {
            selectSubchapter(data.subchapter_id);
        });

        selectSubchapter(data.subchapter_id);

        getSubchapterContent(data.subchapter_id);

        toggleDeleteSubchapterButtonOnHover(subchapterItem, data.subchapter_id);

        editSubchapterTitle(subchapterItem, data.subchapter_id);


    }
    else {
        alert("Eroare in timpul adaugarii subcapitolului.");
        console.error("Eroare: ", data.errors);
    }
   })
   .catch(error => {
    console.error("Eroare: ", error);
   });
}


function deleteSubchapter(subchapterElement, subchapter_id) {

    console.log(`Sterge subcap ${subchapter_id}`);

    let nextToSelect = null;

    const prevSubchapter = subchapterElement.previousElementSibling;
    if (prevSubchapter && prevSubchapter.classList.contains("subchapter-item")) {
        nextToSelect = prevSubchapter;
    }

    else {
        const nextSubchapter = subchapterElement.nextElementSibling;
        if (nextSubchapter && nextSubchapter.classList.contains("subchapter-item")) {
            nextToSelect = nextSubchapter;
        }
    }
    
    const nextToSelectId = nextToSelect ? nextToSelect.getAttribute("data-subchapter-id") : null;

    console.log("Next subchapter to select ", nextToSelectId);


    fetch(`/teacher_dashboard/chapter/delete_subchapter/${subchapter_id}/`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
    })
    .then(response => {
        if(!response.ok) {
            throw new Error("Network response was noy ok.");
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        if(data.success) {
            subchapterElement.remove();
            console.log("subcapitolul ",subchapter_id," a fost sters cu succes.");

            if (nextToSelectId) {
                selectSubchapter(nextToSelectId);
            }
            else {
                document.querySelectorAll(".middle").forEach(section => {
                    section.style.display = "none";
                })
            }
        }
        else {
            alert ("Nu s-a putut sterge subcapitolul!");
        }
    })
    .catch(error => {
        console.error("Error during delete operation: ", error);
    });
}


function toggleDeleteSubchapterButtonOnHover(subchapterElement, subchapterId) {

    console.log("am apelat butonul de stergere...");


    var subchapterTitle = subchapterElement.querySelector(".subchapter-title");

    if (!subchapterTitle) {
        console.error("Nu s-a gasit tilul subcapitolului");
        return;
    }

    var oldDeleteButton = subchapterElement.querySelector(".delete-button");

    if(oldDeleteButton) {
        return;
    }


    var deleteButton = document.createElement("button");
    deleteButton.innerHTML = '<img src="/media/site_icons/delete.png" alt="Delete" style="width: 16px; height: 16px;">';
    deleteButton.setAttribute("title", "Sterge subcapitol");
    deleteButton.classList.add("btn", "delete-button", "btn-sm");
    deleteButton.style.display = "none";
    deleteButton.style.padding = "2px 6px";
    deleteButton.style.marginLeft = "5px";
    deleteButton.style.verticalAlign = "middle";


    subchapterTitle.parentNode.insertBefore(deleteButton, subchapterTitle.nextSibling);

    deleteButton.addEventListener("click", function () {
        showConfirmationDialog(() => {
            deleteSubchapter(subchapterElement, subchapterId);
        }, false);
    });

    subchapterElement.addEventListener("mouseenter", function () {
        deleteButton.style.display = "inline-flex";
    });

    subchapterElement.addEventListener("mouseleave", function () {
        deleteButton.style.display = "none";
    });

}


document.addEventListener("DOMContentLoaded", function () {
    var subchapters = document.querySelectorAll(".subchapter-item");
    
    subchapters.forEach(function (subchapterElement) {
        var subchapterId = subchapterElement.getAttribute("data-subchapter-id");
        toggleDeleteSubchapterButtonOnHover(subchapterElement, subchapterId);
    });
});


function editSubchapterTitle(subchapterElement, subchapterId) {

    let titleElement = subchapterElement.querySelector(".subchapter-title");
    titleElement.style.cursor = "pointer";

    titleElement.addEventListener("dblclick", function () {
        console.log("DBL CLICK PE SUBCAPITOL: ", subchapterId);

        const originalBlurEvent = Event.prototype.blur;
        const disableBlur = () => {
            Event.prototype.blur = function() { 
                console.log("Blur dezactivat temporar");
                return false; 
            };
        };
        
        const enableBlur = () => {
            Event.prototype.blur = originalBlurEvent;
        };
        
        disableBlur();
        
        let editInput = document.createElement("input");
        editInput.type = "text";
        editInput.value = titleElement.textContent;
        editInput.classList.add("form-control");
        editInput.style.margin = "5px 0";

        let titleParent = titleElement.parentNode;
        
        titleElement.style.display = "none";

        titleParent.insertBefore(editInput, titleElement.nextSibling);

        setTimeout(() => {
            enableBlur();
            editInput.focus();
        }, 50);

        let isSaved = false;
        
        editInput.addEventListener("keypress", function (event) {
            if (!isSaved && event.key === "Enter") {
                isSaved = true;
                saveNewSubchapterTitle(subchapterId, editInput.value, titleElement, editInput);
            }
        });
        
        editInput.addEventListener("blur", function () {
            if (!isSaved) {
                saveNewSubchapterTitle(subchapterId, editInput.value, titleElement, editInput);
                isSaved = true;
            }
        });
    });
}


function saveNewSubchapterTitle(subchapter_id, newTitle, titleElement, editInput) {

    if (newTitle.trim() === "") {
        alert("Noul titlu nu poate fi gol!");
        return;
    }

    fetch(`/teacher_dashboard/chapter/update_subchapter/${subchapter_id}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: JSON.stringify({title: newTitle})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {

            titleElement.textContent = newTitle;
            titleElement.style.display = "";
            editInput.remove();
        }
        else {
            console.error("Titlul subcapitolului nu a putut fi actualizat.");
            titleElement.style.display = "";
            editInput.remove();
        }
    })
    .catch(error => {
        console.error("Eroare: ", error);
    });
}


document.addEventListener("DOMContentLoaded", function () {
    var subchapters = document.querySelectorAll(".subchapter-item");

    subchapters.forEach(function (subchapter) {
        var subchapterId = subchapter.getAttribute("data-subchapter-id");
        editSubchapterTitle(subchapter, subchapterId);
    });
});


function saveButton(middleSection) {

    if (document.querySelector(".save-button")) {
        console.log("11111111");
        return;
    }

    const saveButton = document.createElement("button");
    saveButton.className = "save-button";

    saveButton.addEventListener("click", function () {        
        saveMiddleContent(middleSection);
    });

    document.body.appendChild(saveButton);

    return saveButton;
}

function removeSaveButton() {
    const existingButton = document.querySelector(".save-button");
    if (existingButton) {
        existingButton.remove();
        console.log("Butonul save a fost eliminat 22222222.");
    }
}


let selectedChapterId = null;
let selectedSubchapterId = null;

function selectChapter(chapterId) {

    var newChapterElement = document.querySelector(`[data-chapter-id='${chapterId}'] strong`);

    if(!newChapterElement) {
        console.error("capitolul nu a fost gasit, id: ", chapterId);
        return;
    }

    document.querySelectorAll('.chapter-container strong').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.subchapter-item').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.subchapter-title').forEach(el => el.classList.remove('selected'));

    if(selectedChapterId === chapterId) {
        newChapterElement.classList.remove("selected");
        selectedChapterId = null;
        console.log("am deselctat capitolul: ", chapterId);
    }

    else {
        selectedChapterId = chapterId;
        newChapterElement.classList.add("selected");
        console.log("am selctat capitolul: ", chapterId);

        const firstSubchapter = document.querySelector(`[data-chapter-id='${chapterId}'] .subchapter-item`);
        if (firstSubchapter) {
            const firstSubchapterId = firstSubchapter.getAttribute("data-subchapter-id");
            console.log("SE seleceteaza primul subcapitol ", firstSubchapterId);
            selectSubchapter(firstSubchapterId);
        }
        else {
            console.log("nu am intrat");
            document.querySelectorAll(".middle").forEach(section => section.style.display = "none");
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".chapter-container strong").forEach(function (chapterElement) {
        var chapterId = chapterElement.closest(".chapter-container").getAttribute("data-chapter-id");
        chapterElement.addEventListener("click", function () {
            selectChapter(chapterId);
            console.log("am initializat select chapter pt ", chapterId);
        });
    });
}) ;


function getSubchapterContent (subchapter_id) {
    return fetch(`/teacher_dashboard/chapter/subchapter/${subchapter_id}/`)
        .then(response => response.json())
        .then(data => {
            console.log("Informatiile primite despre CONTENT: ", data);
            if (data.success) {

                console.log("am primit inf despre content");
            }
            return data;
            })
            .catch(error => {
                console.error("Eroare la incarcarea continutului: ", error);
            });

    }


function displayContent(middleSection, content) {
    middleSection.innerHTML = "";

    if (!content || content.trim() === "") {
        createEditorDiv(middleSection);
        return;
    }

    const divs = content.split('</p>');

    for (let i = 0; i < divs.length; i++) {
        let div = divs[i].trim();
        
        if (div) {
            if (div.startsWith('<p')) {
                div = div.substring(div.indexOf('>') + 1);
            }
            
            const newDiv = createEditorDiv(middleSection);
            newDiv.querySelector(".ql-editor").innerHTML = div;
        }
    }

    if (middleSection.querySelectorAll('.editor-div').length === 0) {
        createEditorDiv(middleSection);
    }
}

    
function selectSubchapter(subchapterId) {
    console.log("Subcapitol selectat: ", subchapterId);
    
    if (selectedSubchapterId && selectedSubchapterId !== subchapterId) {
        const prevMiddleSection = document.querySelector(`.middle[data-subchapter-id="${selectedSubchapterId}"]`);
        if (prevMiddleSection) {
            saveMiddleContent(prevMiddleSection);
        }
    }

    document.querySelectorAll('.chapter-title').forEach(el => el.classList.remove('selected'));


    const prevSubchapter = document.querySelector(`[data-subchapter-id='${selectedSubchapterId}']`);
    if (prevSubchapter) {
        prevSubchapter.classList.remove('selected');
    }

    selectedSubchapterId = subchapterId;
    const currentSubchapter = document.querySelector(`[data-subchapter-id='${subchapterId}']`);
    if (currentSubchapter) {
        currentSubchapter.classList.add('selected');
    }

    document.querySelectorAll(".middle").forEach(section => section.style.display = "none");

    middleSection = document.querySelector(`.middle[data-subchapter-id='${subchapterId}']`);

    if (!middleSection) {
        middleSection = document.createElement("div");
        middleSection.classList.add("middle");
        middleSection.setAttribute("data-subchapter-id", subchapterId);
        document.querySelector("#middle-section").appendChild(middleSection);
    }

    saveButton(middleSection);

    middleSection.innerHTML = "";

    middleSection.style.display = "block";
   
    getSubchapterContent(subchapterId)
    .then(data => {
        if (data.success) {
            displayContent(middleSection, data.content);
        }
        else {
            middleSection.innerHTML = "";
            createEditorDiv(middleSection);
        }
    })
    .catch(() => {
        middleSection.innerHTML = "";
        createEditorDiv(middleSection);
    });
    
}



document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".subchapter-item").forEach(function (subchapterElement) {
        var subchapterId = subchapterElement.getAttribute("data-subchapter-id");
        subchapterElement.addEventListener("click", function () {
            console.log("click pe subcapitolul: ", subchapterId);
            selectSubchapter(subchapterId);
        });
    });

    const firstSubchapter = document.querySelector(".subchapter-item");
    if (firstSubchapter) {
        const firstSubchapterId = firstSubchapter.getAttribute("data-subchapter-id");
        selectSubchapter(firstSubchapterId);
    }
    else {
        console.log("Nu exista inca subcapitole.");
    }
});





let editors = {};

Quill.register('modules/imageResize', QuillResizeModule);
Quill.register('modules/videoResize', QuillResizeModule);


function createEditorDiv(middleSection) {
    const newDiv = document.createElement("div");
    newDiv.className = "editor-div";
    middleSection.appendChild(newDiv);

    newDiv.style.position = 'relative';
    newDiv.style.margin = '10px 0';
    newDiv.style.padding = '10px';
    newDiv.style.minHeight = '50px';
    newDiv.style.display = 'flex';
    newDiv.style.alignItems = 'left';
    newDiv.style.justifyContent = 'left';
    newDiv.style.marginLeft = '50px';

    newDiv.setAttribute("draggable", "true");

    let currentDiv = null;

    const selection = window.getSelection();

    if (selectedSubchapterId && selection && selection.anchorNode && editors[selectedSubchapterId] && editors[selectedSubchapterId].length > 0) {
       
        const activeEditor = editors[selectedSubchapterId].find(editor => editor.root && editor.root.contains(selection.anchorNode));

        currentDiv = activeEditor ? activeEditor.root.closest('.editor-div') : null;
    }

    if (currentDiv && currentDiv.nextSibling) {
        middleSection.insertBefore(newDiv, currentDiv.nextSibling);
    }
    else {
        middleSection.appendChild(newDiv);
    }

    const quillInstance = new Quill(newDiv, {
        modules: {
            toolbar: false,
            imageResize: {
                displaySize: true
            },
            videoResize: {
                displaySize: true
            },
            clipboard: {
                matchVisual: false
            }
        },
        theme: null,
        placeholder: 'Scrie ceva...',
    });

    attachEnterEvent(newDiv, middleSection);

    quillInstance.focus();

    if (!editors[selectedSubchapterId]) {
        editors[selectedSubchapterId] = [];
    }

    editors[selectedSubchapterId].push({id: newDiv.id, quill: quillInstance, root: quillInstance.root});

    setCursorToEnd(quillInstance);

    createContextMenu(newDiv);

    newDiv.addEventListener('click', function(e) {
        if (e.target === newDiv || newDiv.contains(e.target)) {
            quillInstance.focus();
        }
    });

    return newDiv;
}

function attachEnterEvent(editorDiv, middleSection) {
    editorDiv.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            console.log("am apasat enter.");
            event.preventDefault(); 
            event.stopPropagation();
            
            const newDiv = createEditorDiv(middleSection);
            newDiv.querySelector('.ql-editor').focus();
            
            const quillInstance = getQuillInstance(editorDiv);
            if (quillInstance) {
                const text = quillInstance.getText();
                const lastChar = text.charAt(text.length - 1);
                if (lastChar === '\n') {
                    quillInstance.deleteText(text.length - 1, 1);
                }
            }
        }
    });
}


function getQuillInstance(editorDiv) {

    for (const subchapterId in editors) {
        if (editors[subchapterId]) {

            const editor = editors[subchapterId].find(e => 
                e.root && (e.root === editorDiv || e.root.closest('.editor-div') === editorDiv)
            );
            if (editor && editor.quill) {

                return editor.quill;
            }
        }
    }
    return null;
}


function setCursorToEnd(quillInstance) {
    quillInstance.focus();

    setTimeout(() => {
        const editor = quillInstance.root;
        
        if (editor.childNodes.length > 0) {
            const lastNode = editor.lastChild;

            const range = document.createRange();
            
            const selection = window.getSelection();
            
            range.selectNodeContents(lastNode);

            range.collapse(false); 

            selection.removeAllRanges();

            selection.addRange(range);
        }
    }, 0);
}



function createContextMenu(div) {
    if (!div.querySelector('.delete-button')) {
        const menuIcon = document.createElement("img");
        menuIcon.src = "/static/teacherDashboard/images/menu.png";
        menuIcon.width = 30;
        menuIcon.alt = 'Menu';
        menuIcon.style.position = 'absolute';
        menuIcon.style.left = '-45px';
        menuIcon.style.top = '10px';
        menuIcon.style.cursor = 'pointer';
        menuIcon.style.display = 'none';
        menuIcon.setAttribute('draggable', 'false');

        div.addEventListener("mouseenter", function () {
            menuIcon.style.display = "block";
        });

        div.addEventListener("mouseleave", function () {
            setTimeout(function () {
                if(!menuIcon.matches(':hover')) {
                    menuIcon.style.display = "none";
                }
            }, 100);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.classList.add("delete-button");
        deleteButton.innerHTML = '<img src="/media/site_icons/delete.png" alt="Delete" style="width: 16px; height: 16px;">';
        deleteButton.style.position = "absolute";
        deleteButton.style.left = "45px";
        deleteButton.style.top = "10px";
        deleteButton.style.backgroundColor = "#ffffff";
        deleteButton.style.border = "1px solid #dddddd";
        deleteButton.style.borderRadius = "3px";
        deleteButton.style.padding = "5px";
        deleteButton.style.cursor = "pointer";
        deleteButton.style.display = "none"; 
        deleteButton.style.zIndex = "1000";
        
        deleteButton.addEventListener("click", function() {
            deleteNewDiv(div, selectedSubchapterId);
        });
        
        menuIcon.addEventListener("click", function(event) {
            event.stopPropagation();
            console.log("Icon menu apăsat");
            deleteButton.style.display = deleteButton.style.display === "block" ? "none" : "block";
        });
        
        document.addEventListener("click", function(event) {
            if (deleteButton.style.display === "block" && 
                event.target !== deleteButton && 
                event.target !== menuIcon) {
                deleteButton.style.display = "none";
            }
        });
        
        div.appendChild(menuIcon);
        div.appendChild(deleteButton);
    }
}

function deleteNewDiv(div, subchapterId) {
    const editor = div.querySelector(".ql-editor");
    
    div.remove();

    if (editors[subchapterId] && Array.isArray(editors[subchapterId])) {
        editors[subchapterId] = editors[subchapterId].filter(ed => !editor || ed.root !== editor);
    }

    const middleSection = document.getElementById("middle-section");
    if (middleSection) {
        saveMiddleContent(middleSection);
    }
}



function saveMiddleContent(middleSection) {
    const divs = middleSection.querySelectorAll(".editor-div");
    
    const newContent = Array.from(divs).map(div => {
        const content = div.querySelector('.ql-editor').innerHTML.trim();

        if (content) {
            return '<p>' + content + '</p>';
        }
        return '';
    }).join('');

    fetch('/teacher_dashboard/chapter/subchapter/save_subchapter/', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector("meta[name='csrf-token']").getAttribute("content")
        },
        body: JSON.stringify({
            subchapter_id: selectedSubchapterId,
            content: newContent
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            console.log("Conținutul a fost salvat cu succes");
        }
        else {
            console.error("Eroare la salvare: ",data.error);
        }
    })
    .catch(error => {
        console.error("Eroare la trimiterea cererii: ", error);
    });
}


let draggedDiv = null;

document.addEventListener("dragstart", function(event) {
    const targetDiv = event.target.closest(".editor-div");
    if (targetDiv) {
        console.log("DRAG START");

        draggedDiv = targetDiv;
        targetDiv.style.opacity = 0.5;
    }
});

document.addEventListener("dragend", function () {
    if (draggedDiv) {
        console.log("DRAG END");

        draggedDiv.style.opacity = "";
        draggedDiv = null;

        document.querySelectorAll(".editor-div").forEach(div => {
            div.classList.remove("drag-over-top", "drag-over-bottom");
        });
    }
});


document.addEventListener("dragover", function (event) {
    event.preventDefault();

    const dropZone = event.target.closest(".editor-div");

    console.log("DRAG OVER");

    if (dropZone && dropZone != draggedDiv) {
        const rect = dropZone.getBoundingClientRect();

        if (event.clientY < rect.top + rect.height / 2) {
            dropZone.classList.add("drag-over-top");
            dropZone.classList.remove("drag-over-bottom");
        }
        else {
            dropZone.classList.add("drag-over-bottom");
            dropZone.classList.remove("drag-over-top");
        }
    }
});

document.addEventListener("dragleave", function (event) {
    const dropZone = event.target.closest(".editor-div");
    if (dropZone) {
        console.log("DRAG LEAVE");
        dropZone.classList.remove("drag-over-bottom", "drag-over-top");
    }
});


document.addEventListener("drop", function (event) {
    event.preventDefault();
    const dropZone = event.target.closest(".editor-div");
    const middleSection = document.querySelector(`.middle[data-subchapter-id="${selectedSubchapterId}"]`);
    const rect = dropZone.getBoundingClientRect();


    if (event.clientY < rect.top + rect.height / 2) {
        console.log("111111");
        middleSection.insertBefore(draggedDiv, dropZone);
    }

    else {
        if (dropZone.nextSibling) {
            console.log("222222");
            middleSection.insertBefore(draggedDiv, dropZone.nextSibling);
            }
        else {
            middleSection.appendChild(draggedDiv);
        }
    }

    saveMiddleContent(middleSection);

    document.querySelectorAll(".editor-div").forEach(div => {
        div.classList.remove("drag-over-top", "drag-over-bottom");
    });

    draggedDiv.style.opacity = "";
    draggedDiv = null;

});


function publishEdit() {
    const courseId = document.getElementById("chapter-list").getAttribute("data-course-id");
    const confirmed = window.confirm("Esti sigur? Dupa publicarea cursului vei putea modifica numai continutul existent.");
    if (!confirmed) {
        return; 
    }
    
    fetch('/teacher_dashboard/course/publish_course/', {
        method: "POST",
        headers: {
            'X-CSRFToken': document.querySelector("meta[name='csrf-token']").getAttribute("content"),
            'Content-Type': "application/json",
        },
        body: JSON.stringify({course_id: courseId})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Modificarile au fost publicate cu succes.");

            disableButtons();

            document.getElementById("chapter-list").setAttribute("data-is-published", "true");

        }
        else {
            console.error("Eroare in publicare cursului: ", data.error);
        }
    })
    .catch(error => {
        console.error("Eroare in publicare cursului: ", error);
    });
}

function disableButtons() {
    const buttons = ['add-chapter-btn', 'add-subchapter-btn', 'add-quiz-btn'];
    buttons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.onclick = null; 
        }
    });
}

function checkCourseStatus() {
    const isPublished = document.getElementById("chapter-list").getAttribute("data-is-published") === "true";
    if (isPublished) {
        disableButtons();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    checkCourseStatus();
});


function italicText() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            return true;
        }
    });

    if (activeEditor) {
        const format = activeEditor.quill.getFormat();
        activeEditor.quill.format('italic', !format.italic);
    }
}

function boldText() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            return true;
        }
    });

    if (activeEditor) {
        const format = activeEditor.quill.getFormat();
        activeEditor.quill.format('bold', !format.bold);
    }
}

function underlineText() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            //console.log("Editor gasit:", editor);
            return true;
        }
    });

    if (activeEditor) {
        const format = activeEditor.quill.getFormat();
        activeEditor.quill.format('underline', !format.underline);
    }
}

function strikethroughText() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            //console.log("Editor gasit:", editor);
            return true;
        }
    });

    if (activeEditor) {
        const format = activeEditor.quill.getFormat();
        activeEditor.quill.format('strike', !format.strike);
    }
}


function textFormat() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            //console.log("Editor gasit:", editor);
            return true;
        }
    });

    if (activeEditor) {
        const range = activeEditor.quill.getSelection();
        if (range) {
            activeEditor.quill.removeFormat(range.index, range.length);
        }
    }
}

function header1() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            //console.log("Editor gasit:", editor);
            return true;
        }
    });

    if (activeEditor) {
        activeEditor.quill.format('header', 1);
    }
}


function header2() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            //console.log("Editor gasit:", editor);
            return true;
        }
    });
    if (activeEditor) {
        activeEditor.quill.format('header', 2);
    }
}

function header3() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            //console.log("Editor gasit:", editor);
            return true;
        }
    });
    if (activeEditor) {
        activeEditor.quill.format('header', 3);
    }
}

function bulletList() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            //console.log("Editor gasit:", editor);
            return true;
        }
    });
    if (activeEditor) {
        activeEditor.quill.format('list', 'bullet');
    }
}

function numberedList() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            //console.log("Editor gasit:", editor);
            return true;
        }
    });
    if (activeEditor) {
        activeEditor.quill.format('list', 'ordered');
    }
}

function codeFormat() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;
    
    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            return true;
        }
    });
    
    if (activeEditor) {
        const length = activeEditor.quill.getLength();
        const format = activeEditor.quill.getFormat(0, length);
        
        if (format['code-block']) {
            activeEditor.quill.formatText(0, length, 'code-block', false);
        } else {
            activeEditor.quill.formatText(0, length, 'code-block', true);
        }
    }
}


function quoteFormat() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            //console.log("Editor gasit:", editor);
            return true;
        }
    });
    if (activeEditor) {
        activeEditor.quill.format('blockquote', true);
    }
}

function callout() {
    const selection = window.getSelection();
    const anchorNode = selection ? selection.anchorNode : null;

    const activeEditor = editors[selectedSubchapterId].find(editor => {
        if (editor.root && editor.root.contains(anchorNode)) {
            //console.log("Editor gasit:", editor);
            return true;
        }
    });
    if (activeEditor) {
        activeEditor.quill.format('blockquote', true);
        let format = activeEditor.quill.getFormat();
        if (format.blockquote) {
            activeEditor.quill.format('class', 'ql-callout');
        }
    }
}


function uploadImage(input) {

    const file = input.files[0];
    if (file) {

        const reader = new FileReader();

        reader.onload = function (e) {

            const tempImageURL = e.target.result;

            let activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
            const middleSection = document.querySelector('.middle[data-subchapter-id="' + selectedSubchapterId + '"]'); 

            if (!activeEditor || (!isImageOnly(activeEditor) && activeEditor.root.innerText.trim() !== '')) {

                createEditorDiv(middleSection);

                activeEditor = Object.values(editors).flat().at(-1);
            }

            const range = activeEditor.quill.getSelection();
            const insertIndex = range ? range.index : activeEditor.quill.getLength();

            activeEditor.quill.insertEmbed(insertIndex, 'image', tempImageURL);
            activeEditor.quill.root.setAttribute('contentEditable', 'false');

            createEditorDiv(middleSection);

            saveImage(file, (publicUrl) => {

                activeEditor.quill.deleteText(insertIndex, 1);

                activeEditor.quill.insertEmbed(insertIndex, 'image', publicUrl);

                saveMiddleContent(middleSection);

            });
        };
        reader.readAsDataURL(file);
    }
}


function saveImage(file, callback) {
    const formData = new FormData();
    formData.append('image', file);

    fetch('/teacher_dashboard/upload_image/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.url) {
                console.log("Image uploaded to server at URL:", data.url);
                callback(data.url); 
            } else {
                console.error("Eroare server:", data.error);
            }
        })
        .catch(error => {
            console.error("Eroare:", error);
        });
}


function isImageOnly(editor) {
    return editor.quill.root.querySelector('img') && editor.quill.root.innerText.trim() === '';
}


function uploadVideo(input) {

    const file = input.files[0];
    if (file) {

        const reader = new FileReader();

        reader.onload = function (e) {

            const tempVideoURL = e.target.result;

            let activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
            const middleSection = document.querySelector('.middle[data-subchapter-id="' + selectedSubchapterId + '"]');

            if (!activeEditor || (activeEditor.root.innerHTML.trim() !== '' && !isVideoOnly(activeEditor))) {

                createEditorDiv(middleSection);

                activeEditor = Object.values(editors).flat().at(-1);
                if (!activeEditor) {
                    console.error("Active editor nu a fost găsit după creare.");
                    return;
                }
            }

            const range = activeEditor.quill.getSelection();
            const insertIndex = range ? range.index : activeEditor.quill.getLength();

            activeEditor.quill.insertEmbed(insertIndex, 'video', tempVideoURL);
            activeEditor.quill.root.setAttribute('contentEditable', 'false');

            createEditorDiv(middleSection);

            saveVideoToServer(file, (publicUrl) => {

                activeEditor.quill.deleteText(insertIndex, 1);

                activeEditor.quill.insertEmbed(insertIndex, 'video', publicUrl);

                saveMiddleContent(middleSection);
            });
        };

        reader.readAsDataURL(file);
    }
}


function saveVideoToServer(file, callback) {

    const formData = new FormData();
    formData.append('video', file);
    let videoUrl = '/teacher_dashboard/upload_video/';

    fetch(videoUrl, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.url) {
                console.log("Video uploaded to server at URL:", data.url);
                callback(data.url); 
            } else {
                console.error("Server returned an error:", data.error);
            }
        })
        .catch(error => {
            console.error("Error uploading video:", error);
        });
}


function isVideoOnly(editor) {
    return editor.quill.root.querySelector('video') && editor.quill.root.innerText.trim() === '';
}


function defaultTextColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('color', '#333333'); 
    }
}

function greyColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('color', '#707070'); 
    }
}

function brownColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('color', '#8B6D5C'); 
    }
}

function orangeColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('color', '#E67E22');
    }
}

function yellowColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('color', '#D4AC0D');
    }
}

function greenColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('color', '#27AE60'); 
    }
}

function blueColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('color', '#3498DB');
    }
}

function purpleColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('color', '#8E44AD'); 
    }
}

function pinkColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('color', '#E84393'); 
    }
}

function redColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('color', '#C0392B');
}
}

function defaultBackgroundColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('background', 'transparent');
    }
}

function greyBackgroundColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('background', '#F2F2F2'); 
    }
}

function brownBackgroundColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('background', '#F5EEE8'); 
    }
}

function orangeBackgroundColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('background', '#FDEBD0'); 
    }
}

function yellowBackgroundColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('background', '#FCF3CF');
    }
}

function greenBackgroundColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('background', '#E9F7EF'); 
    }
}

function blueBackgroundColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('background', '#EBF5FB'); 
    }
}

function purpleBackgroundColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('background', '#F4ECF7');
    }
}

function pinkBackgroundColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('background', '#FDEFF6'); 
    }
}

function redBackgroundColor() {
    const activeEditor = Object.values(editors).flat().find(editor => editor.root.contains(window.getSelection().anchorNode));
    if (activeEditor) {
        activeEditor.quill.format('background', '#FADBD8'); 
    }
}




