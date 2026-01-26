function showQuestion() {
    if (selectedCategories.length === 0) {
        alert('Te rugăm să selectezi cel puțin o categorie!');
        return;
    }
    
    document.getElementById('step-1').style.display = 'none';

    document.getElementById('step-2').style.display = 'block';
    
    loadRandomQuestion();
}


function showCategories() {

    document.getElementById('step-2').style.display = 'none';

    document.getElementById('step-1').style.display = 'block';
}


function loadRandomQuestion() {

    document.getElementById('answer-text').style.display = 'none';

    const flipButton = document.querySelector('button[onclick="flipCard()"]');
    if (flipButton) {
        flipButton.title = 'Arată răspunsul';
    }
    
    let url = '/get_random_question/?';
    selectedCategories.forEach((categoryId, index) => {
        if (index > 0) url += '&';
        url += `categories[]=${categoryId}`;
    });
    
    fetch(url)
        .then(response => {

            if (!response.ok) {
                throw new Error(`eroare http, status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {

            console.log("Răspuns primit:", data);
            document.getElementById('question-text').innerText = data.question;
            document.getElementById('answer-text').innerText = data.answer;
        })

        .catch(error => {
            console.error('Error:', error);
            document.getElementById('question-text').innerText = 'Eroare la încărcarea întrebării.';
            document.getElementById('answer-text').innerText = 'Încearcă din nou.';
        });
}


function flipCard() {

    const card = document.querySelector('.flip-card');

    card.classList.toggle('flipped');
    
    if (card.classList.contains('flipped')) {
        document.getElementById('answer-text').style.display = 'block';
    }
}


document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('category-list').children.length === 0) {
        loadCategories();
    }
});