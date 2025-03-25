import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBPb2LNteDn8B1ZqqeGsZFoZK6lwCr730o",
    authDomain: "assistentbot-886e7.firebaseapp.com",
    projectId: "assistentbot-886e7",
    storageBucket: "assistentbot-886e7.firebasestorage.app",
    messagingSenderId: "867234276353",
    appId: "1:867234276353:web:06038dc8caaff9a4e40c00",
    measurementId: "G-3WVQ1LNK9B"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // Экспортируем db для использования в info-notes.js

// Получаем telegram_id пользователя
const telegramId = Telegram.WebApp.initDataUnsafe.user?.id;
if (!telegramId) {
    console.error("Ошибка: telegram_id не найден.");
}

// Функция для получения всех документов из коллекции notes, отфильтрованных по telegram_id
async function fetchNotes() {
    try {
        const notesCollection = collection(db, 'notes');

        // Фильтруем заметки по telegram_id
        const q = query(notesCollection, where('telegram_id', '==', telegramId));
        const querySnapshot = await getDocs(q);

        const notesContainer = document.getElementById('sheet-content');

        // Проверяем, существует ли элемент notes-container
        if (!notesContainer) {
            console.error('Элемент notes-container не найден в DOM.');
            return;
        }

        notesContainer.innerHTML = ''; // Очищаем контейнер перед добавлением новых данных

        querySnapshot.forEach((doc) => {
            const noteData = doc.data();
            const noteId = doc.id;

            // Создаем элемент для отображения заметки
            const noteElement = document.createElement('div');
            noteElement.className = 'note';

            noteElement.innerHTML = `
                <div class="checkbox-container">
                    <div class="left-content">
                        <input 
                            type="checkbox" 
                            id="note-${noteId}" 
                            ${noteData.completed ? 'checked' : ''}
                            onchange="toggleCompletion('${noteId}', this.checked)"
                        >                
                        <p class="${noteData.completed ? 'completed' : ''}">${noteData.note || 'Без названия'}</p>
                    </div>
                    <div class="right-content">
                        <span class="edit-icon" onclick="editNote('${noteId}')">
                            <img src="icon/pen-linear.svg" alt="Pen Icon" width="20" height="20">
                        </span>
                        <span class="delete-icon" onclick="deleteNote('${noteId}')">
                            <img src="icon/delete.svg" alt="Delete Icon" width="20" height="20">
                        </span>
                    </div>
                </div>
            `;

            notesContainer.appendChild(noteElement);
        });
    } catch (error) {
        console.error('Ошибка при получении документов:', error);
    }
}

// Функция для обновления статуса completed
async function toggleCompletion(noteId, newStatus) {
    try {
        const noteRef = doc(db, 'notes', noteId);
        await updateDoc(noteRef, {
            completed: newStatus
        });

        console.log('Статус успешно обновлен!');
        fetchNotes(); // Обновляем список заметок после изменения статуса
    } catch (error) {
        console.error('Ошибка при обновлении статуса:', error);
    }
}

// Функция для удаления заметки
async function deleteNote(noteId) {
    const confirmDelete = confirm('Вы уверены, что хотите удалить эту заметку?');
    if (confirmDelete) {
        try {
            const noteRef = doc(db, 'notes', noteId);
            await deleteDoc(noteRef);

            console.log('Заметка успешно удалена!');
            fetchNotes(); // Обновляем список заметок после удаления
        } catch (error) {
            console.error('Ошибка при удалении заметки:', error);
        }
    }
}

// Функция для внесения изменения в заметки
async function editNote(noteId) {
    // Добавляем обработчик клика на заметку
    openNoteModal(noteId); // Открываем модальное окно с информацией о заметке
}

// Делаем функции доступными глобально, чтобы они могли быть вызваны из HTML
window.toggleCompletion = toggleCompletion;
window.deleteNote = deleteNote;
window.editNote = editNote;

// Загружаем заметки при загрузке страницы
document.addEventListener('DOMContentLoaded', fetchNotes);