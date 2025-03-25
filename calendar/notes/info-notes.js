import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { db } from "./script.js"; // Импортируем db из основного скрипта

// Получаем элементы модального окна
const modal = document.getElementById('note-modal');
const modalTitle = document.getElementById('modal-title-notes');
const modalDescription = document.getElementById('modal-description');
const editIcon = document.getElementById('edit-icon-notes');
const descriptionEdit = document.getElementById('description-edit-notes');
const saveDescriptionBtn = document.getElementById('save-description-notes');
const closeModal = document.querySelector('.close-notes');

// Переменная для хранения ID текущей заметки
let currentNoteId = null;

// Функция для открытия модального окна с информацией о заметке
async function openNoteModal(noteId) {
    try {
        const noteRef = doc(db, 'notes', noteId);
        const noteDoc = await getDoc(noteRef);

        if (noteDoc.exists()) {
            const noteData = noteDoc.data();

            // Заполняем модальное окно данными
            modalTitle.textContent = noteData.note || 'Без названия';
            modalDescription.textContent = noteData.description || 'Описание отсутствует';
            descriptionEdit.value = noteData.description || ''; // Заполняем текстовое поле

            // Сохраняем ID текущей заметки
            currentNoteId = noteId;

            // Открываем модальное окно
            modal.style.display = 'flex';
        } else {
            console.error('Заметка не найдена.');
        }
    } catch (error) {
        console.error('Ошибка при получении данных заметки:', error);
    }
}

// Функция для закрытия модального окна
function closeNoteModal() {
    modal.style.display = 'none';
    currentNoteId = null;
}

// Обработчик для иконки карандаша (редактирование описания)
editIcon.addEventListener('click', () => {
    modalDescription.style.display = 'none'; // Скрываем статическое описание
    descriptionEdit.style.display = 'block'; // Показываем текстовое поле
    saveDescriptionBtn.style.display = 'block'; // Показываем кнопку "Сохранить"
    descriptionEdit.focus(); // Фокусируемся на текстовом поле
});

// Обработчик для кнопки "Сохранить"
saveDescriptionBtn.addEventListener('click', async () => {
    const newDescription = descriptionEdit.value.trim();

    if (currentNoteId) {
        try {
            const noteRef = doc(db, 'notes', currentNoteId);
            await updateDoc(noteRef, {
                description: newDescription,
            });

            // Обновляем отображаемое описание
            modalDescription.textContent = newDescription || 'Описание отсутствует';
            modalDescription.style.display = 'block'; // Показываем статическое описание
            descriptionEdit.style.display = 'none'; // Скрываем текстовое поле
            saveDescriptionBtn.style.display = 'none'; // Скрываем кнопку "Сохранить"

            alert('Описание успешно обновлено!');
        } catch (error) {
            console.error('Ошибка при обновлении описания:', error);
            alert('Произошла ошибка при обновлении описания.');
        }
    }
});

// Закрытие модального окна при клике на крестик
closeModal.addEventListener('click', closeNoteModal);

// Закрытие модального окна при клике вне его области
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeNoteModal();
    }
});

// Делаем функцию openNoteModal доступной глобально
window.openNoteModal = openNoteModal;