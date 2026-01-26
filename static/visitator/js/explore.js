document.addEventListener("DOMContentLoaded", function () {
    const filterCheckboxes = document.querySelectorAll('[data-filter-type]');
    const courseList = document.getElementById('courseList');
    const categoryToggle = document.getElementById('categoryToggle');
    const languageToggle = document.getElementById('languageToggle');

    filterCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            updateCourseList();
        });
    });

    function updateCourseList() {
        let selectedCategories = [];
        let selectedLanguages = [];

        document.querySelectorAll('input[data-filter-type="category"]:checked').forEach((checkbox) => {
            selectedCategories.push(checkbox.value);
        });

        document.querySelectorAll('input[data-filter-type="language"]:checked').forEach((checkbox) => {
            selectedLanguages.push(checkbox.value);
        });

        fetch(`/filter_courses/?categories=${selectedCategories.join(',')}&languages=${selectedLanguages.join(',')}`)
            .then(response => response.json())
            .then(data => {
                courseList.innerHTML = data.html;
            })
            .catch(error => {
                console.error('Eroare:', error);
            });
    }

    function toggleSection(toggleButton, targetId) {

        const collapseTarget = document.getElementById(targetId);

        const icon = toggleButton.querySelector('i');
    
        if (collapseTarget.style.display === 'none' || !collapseTarget.style.display) {
            collapseTarget.style.display = 'block';
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        } else {
            collapseTarget.style.display = 'none';
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
    }

    categoryToggle.addEventListener('click', function() {
        toggleSection(this, 'categoryFilterCollapse');
    });

    languageToggle.addEventListener('click', function() {
        toggleSection(this, 'languageFilterCollapse');
    });

    function initializeVisibility() {
        document.getElementById('categoryFilterCollapse').style.display = 'none';
        document.getElementById('languageFilterCollapse').style.display = 'none';
    }

    initializeVisibility();

    const categorySearch = document.getElementById('categorySearch');

    const categoryList = document.getElementById('categoryList');

    const categoryItems = categoryList.getElementsByClassName('filter-item');

    if (categorySearch) {

        categorySearch.addEventListener('input', function () {

            const filter = categorySearch.value.toLowerCase();

            Array.from(categoryItems).forEach(function (item) {

                const label = item.querySelector('label').innerText.toLowerCase();
                
                if (label.includes(filter)) {
                    item.style.display = 'flex';
                } 
                else {
                    item.style.display = 'none';
                }
            });
        });
    }

});