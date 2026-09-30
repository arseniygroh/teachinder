document.addEventListener('DOMContentLoaded', function() {
    const addTeacherBtns = document.querySelectorAll('.add_teacher_btn');
    const teacherCards = document.querySelectorAll('.teacher-card');
    const addTeacherModal = document.getElementById('add-teacher-modal');
    const teacherInfoModal = document.getElementById('teacher-info-modal');
    const closeAddTeacherModalBtn = addTeacherModal.querySelector('.modal__close');
    const closeTeacherInfoModalBtn = teacherInfoModal.querySelector('.modal__close');
    addTeacherBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            addTeacherModal.classList.add("is-open");
            addTeacherModal.setAttribute("aria-hidden", "false");
        });
    });

    closeAddTeacherModalBtn?.addEventListener('click', function() {
        addTeacherModal.classList.remove("is-open");
        addTeacherModal.setAttribute("aria-hidden", "true");
    });

    teacherCards.forEach(card => {
        card.addEventListener('click', function() {
            teacherInfoModal.classList.add("is-open");
            teacherInfoModal.setAttribute("aria-hidden", "false");
        });
    });

    closeTeacherInfoModalBtn?.addEventListener('click', function() {
        teacherInfoModal.classList.remove("is-open");
        teacherInfoModal.setAttribute("aria-hidden", "true");
    });

});