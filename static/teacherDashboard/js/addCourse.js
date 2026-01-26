let selectedCategories = [];

document.addEventListener('DOMContentLoaded', function() {

    if (typeof existingCategoryIds !== 'undefined') {
       selectedCategories = existingCategoryIds.slice(); 
       console.log('Categorii existente incarcate:', selectedCategories);
   }
   loadCategories();
});

function loadCategories() {
   fetch('/teacher_dashboard/get_categories/')
       .then(response => response.json())
       .then(data => {
           if (data.success) {
               const categoryList = document.getElementById('category-list');

               categoryList.innerHTML = ''; 


               data.categories.forEach(category => {
                   const categoryItem = document.createElement('div');
                   categoryItem.classList.add('category-item');
                   categoryItem.innerText = category.name;

                   categoryItem.setAttribute('data-id', category.id);  


                   if (selectedCategories.includes(category.id.toString())) {
                       categoryItem.classList.add('selected');
                   }


                   categoryItem.addEventListener('click', () => toggleCategorySelection(category.id, categoryItem));


                   categoryList.appendChild(categoryItem);
               });
               

               updateSelectedCategories();
           } else {
               console.error('Error fetching categories');
           }
       })
       .catch(error => {
           console.error('Error loading categories:', error);
       });
}


function toggleCategorySelection(categoryId, categoryItem) {

    const categoryIndex = selectedCategories.indexOf(categoryId.toString());

    if (categoryIndex === -1) {
       selectedCategories.push(categoryId.toString()); 
       categoryItem.classList.add('selected');
   } 

   else {
       selectedCategories.splice(categoryIndex, 1); 
       categoryItem.classList.remove('selected');
   }


   updateSelectedCategories();
}


function updateSelectedCategories() {
   const selectedCategoriesDiv = document.getElementById('selected-categories');
   const selectedCategoryInputsDiv = document.getElementById('selected-category-inputs');


   selectedCategoriesDiv.innerHTML = '';  
   selectedCategoryInputsDiv.innerHTML = ''; 


   selectedCategories.forEach(categoryId => {

    
       const categoryItem = document.querySelector(`#category-list .category-item[data-id="${categoryId}"]`);
       if (categoryItem) {
           const categoryName = categoryItem.innerText;


           const categoryElement = document.createElement('span');
           categoryElement.classList.add('selected-category');
           categoryElement.innerText = categoryName;
           categoryElement.setAttribute('data-id', categoryId); 
           selectedCategoriesDiv.appendChild(categoryElement);

           const categoryInput = document.createElement('input');
           categoryInput.type = 'hidden';
           categoryInput.name = 'categories';  
           categoryInput.value = categoryId;
           selectedCategoryInputsDiv.appendChild(categoryInput);
       }
   });
}


function previewImage() {

   const file = document.getElementById("course_image").files[0];
   const reader = new FileReader();

   reader.onload = function (e) {
       const preview = document.getElementById("course-image-preview");

       preview.src = e.target.result; 
   };

   if (file) {
       reader.readAsDataURL(file);
   }
}