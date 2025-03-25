import { db, doc, getDoc } from './firebase.js';

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем mini app на весь экран

// Получаем параметр из URL (например, business_id)
const urlParams = new URLSearchParams(window.location.search);
const businessId = urlParams.get('business_id');

if (!businessId) {
    alert('Ошибка: не удалось получить ID бизнеса.');
    throw new Error('Business ID не найден.');
}

// Функция для загрузки данных из Firestore
async function loadBusinessProfile() {
    try {
        // Получаем документ из Firestore
        const docRef = doc(db, 'business_questionnaire', businessId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // Отображаем основные данные на странице
            document.getElementById('profile-photo').src = data.foto || 'https://via.placeholder.com/100'; // Если фото нет, используем заглушку
            document.getElementById('profile-name').textContent = data.name || 'Не указано';
            document.getElementById('category').textContent = data.category || 'Не указано';
            document.getElementById('info').textContent = data.info || 'Не указано';
            document.getElementById('address').textContent = data.address || 'Не указано';

            // Отображаем режим работы, если он есть
            if (data.operating_mode) {
                document.getElementById('monday').textContent = data.operating_mode.monday || 'Не указано';
                document.getElementById('tuesday').textContent = data.operating_mode.tuesday || 'Не указано';
                document.getElementById('wednesday').textContent = data.operating_mode.wednesday || 'Не указано';
                document.getElementById('thursday').textContent = data.operating_mode.thursday || 'Не указано';
                document.getElementById('friday').textContent = data.operating_mode.friday || 'Не указано';
                document.getElementById('saturday').textContent = data.operating_mode.saturday || 'Не указано';
                document.getElementById('sunday').textContent = data.operating_mode.sunday || 'Не указано';
            } else {
                console.warn('Режим работы не указан.');
            }
        } else {
            alert('Данные о бизнесе не найдены.');
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        alert('Произошла ошибка при загрузке данных.');
    }
}

// Логика для аккордеона (раскрытие/сворачивание)
const scheduleToggle = document.querySelector('.schedule-toggle');
const scheduleContent = document.querySelector('.schedule-content');
const arrow = document.querySelector('.arrow');

scheduleToggle.addEventListener('click', () => {
    if (scheduleContent.style.display === 'none') {
        scheduleContent.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)'; // Поворачиваем стрелку вверх
    } else {
        scheduleContent.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)'; // Возвращаем стрелку в исходное положение
    }
});

// Обработчик кнопки "Записаться"
const bookButton = document.getElementById('book-button');
bookButton.addEventListener('click', () => {
    // Перенаправляем пользователя на страницу выбора услуг
    window.location.href = `choose_service.html?business_id=${businessId}`;
});

// Загружаем данные при загрузке страницы
loadBusinessProfile();