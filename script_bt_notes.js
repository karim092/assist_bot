// Получаем элемент кнопки "Заметки"
const openNotesBtn = document.getElementById('open-notes-btn');

if (!openNotesBtn) {
    console.error("Ошибка: кнопка 'Заметки' не найдена.");
} else {
    // Обработчик нажатия на кнопку "Заметки"
    openNotesBtn.addEventListener('click', () => {
        // Перенаправляем пользователя на страницу заметок
        window.location.href = './notes/index.html';
    });
}