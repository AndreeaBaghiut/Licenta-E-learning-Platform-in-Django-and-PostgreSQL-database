document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('next-btn')) {
            e.preventDefault();
            
            const subchapterId = e.target.getAttribute('data-subchapter-id');
            if (!subchapterId) return;
            
            fetch('/student_dashboard/mark-next/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                },
                body: JSON.stringify({
                    subchapter_id: subchapterId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error:', data.error);
                    return;
                }
                
     
                if (data.next_type === 'completed') {
                    document.getElementById('middle-section').innerHTML = `
                        <div class="alert ${data.passed ? 'alert-success' : 'alert-danger'}">
                            <h4>${data.passed ? 'Felicitări!' : 'Curs finalizat'}</h4>
                            <p>${data.message}</p>
                            <div class="progress mt-3">
                                <div class="progress-bar ${data.passed ? 'bg-success' : 'bg-danger'}" 
                                    role="progressbar" 
                                    style="width: ${data.score}%" 
                                    aria-valuenow="${data.score}" 
                                    aria-valuemin="0" 
                                    aria-valuemax="100">${data.score}%</div>
                            </div>
                        </div>
                    `;
                } 


                else if (data.next_type === 'subchapter') {
                    updateNavigation(data.subchapter_id);
                    
                    document.getElementById('middle-section').innerHTML = `
                        <h3>${data.title}</h3>
                        <div class="subchapter-content">
                            ${data.content}
                        </div>
                        ${data.next_exists ? 
                        `<button class="btn btn-success mt-3 next-btn" data-subchapter-id="${data.subchapter_id}">Next</button>` : 
                        ''}
                    `;
                } 


                else if (data.next_type === 'quiz') {
                    updateNavigation(data.subchapter_id);
                    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                    
                    let quizHtml = `
                        <div id="quiz-container">
                            <form class="quiz-form" data-quiz-id="${data.quiz_id}">
                                <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                    `;
                    
                    data.questions.forEach(question => {
                        quizHtml += `
                            <div class="quiz-question">
                                <p>${question.text}</p>
                        `;
                        
                        question.answers.forEach(answer => {
                            quizHtml += `
                                <div class="form-check">
                                    <input type="radio" name="question_${question.id}" value="${answer.id}" 
                                        class="form-check-input" required>
                                    <label class="form-check-label">${answer.text}</label>
                                </div>
                            `;
                        });
                        
                        quizHtml += `</div>`;
                    });
                    
                    quizHtml += `
                                <button type="submit" class="btn btn-primary mt-3">Submit Answer</button>
                            </form>
                        </div>
                    `;
                    
                    document.getElementById('middle-section').innerHTML = quizHtml;
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    });
    


    function updateNavigation(subchapterId) {

        const selectedSubchapter = document.querySelector(`.subchapter-item[data-subchapter-id="${subchapterId}"]`);
        if (!selectedSubchapter) return;
        

        document.querySelectorAll('.subchapter-item').forEach(sub => {
            sub.classList.remove('selected');
        });
        selectedSubchapter.classList.add('selected');
        

        const parentList = selectedSubchapter.closest('.subchapter-list');
        const chapterId = parentList.getAttribute('data-chapter-id');
        const chapterElement = document.querySelector(`.chapter-container[data-chapter-id="${chapterId}"]`);
            

        document.querySelectorAll('.chapter-container').forEach(ch => {
            ch.classList.remove('active');
        });
        chapterElement.classList.add('active');
                
        document.querySelectorAll('.subchapter-list').forEach(list => {
            list.style.display = 'none';
        });
        parentList.style.display = 'block';
    }
    

    document.body.addEventListener('submit', function(e) {
        if (e.target.classList.contains('quiz-form')) {
            e.preventDefault();
            

            const quizId = e.target.getAttribute('data-quiz-id');
            if (!quizId) return;
            

            const formData = new FormData(e.target);
            

            fetch(`/student_dashboard/submit_quiz/${quizId}/`, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error:', data.error);
                    return;
                }
                

                e.target.style.display = 'none';
                

                if (data.next_type === 'completed') {
                    document.getElementById('middle-section').innerHTML = `
                        <div class="alert ${data.passed ? 'alert-success' : 'alert-danger'}">
                            <h4>${data.passed ? 'Felicitări!' : 'Curs finalizat'}</h4>
                            <p>${data.message}</p>
                            <div class="progress mt-3">
                                <div class="progress-bar ${data.passed ? 'bg-success' : 'bg-danger'}" 
                                    role="progressbar" 
                                    style="width: ${data.score}%" 
                                    aria-valuenow="${data.score}" 
                                    aria-valuemin="0" 
                                    aria-valuemax="100">${data.score}%</div>
                            </div>
                        </div>
                    `;
                    return; 
                }
                

                const feedbackDiv = document.createElement('div');
                feedbackDiv.id = 'feedback-section';
                feedbackDiv.className = 'mt-4';
                

                let feedbackHtml = '';
                data.feedback.forEach(item => {
                    feedbackHtml += `
                        <div class="alert ${item.is_correct ? 'alert-success' : 'alert-danger'}">
                            <strong>${item.question}</strong><br>
                            ${item.is_correct ? 'Răspuns corect!' : 'Răspuns greșit. Răspuns corect: ' + item.correct_answer}
                        </div>
                    `;
                });
                

                if (data.next_type === 'quiz') {
                    feedbackHtml += `
                        <div id="next-quiz-container" class="mt-4">
                            <h4>${data.quiz_title || 'Quiz'}</h4>
                            <form class="quiz-form" data-quiz-id="${data.quiz_id}">
                                <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
                    `;
                    
                    data.questions.forEach(question => {
                        feedbackHtml += `
                            <div class="quiz-question">
                                <p>${question.text}</p>
                        `;
                        
                        question.answers.forEach(answer => {
                            feedbackHtml += `
                                <div class="form-check">
                                    <input type="radio" name="question_${question.id}" value="${answer.id}" 
                                        class="form-check-input" required>
                                    <label class="form-check-label">${answer.text}</label>
                                </div>
                            `;
                        });
                        
                        feedbackHtml += `</div>`;
                    });
                    
                    feedbackHtml += `
                                <button type="submit" class="btn btn-primary mt-3">Submit Answer</button>
                            </form>
                        </div>
                    `;
                } 

                else if (data.next_exists) {
                    feedbackHtml += `
                        <button class="btn btn-success mt-3 next-btn" data-subchapter-id="${data.subchapter_id}">Next</button>
                    `;
                }
                
                document.getElementById('middle-section').innerHTML = feedbackHtml;
            })
            .catch(error => {
                console.error('error:', error);
            });
        }
    });
});