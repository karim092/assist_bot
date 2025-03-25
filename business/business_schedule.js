import { db, doc, updateDoc, getDoc } from './firebase.js';

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем mini app на весь экран

// Получаем telegram_id из URL
const urlParams = new URLSearchParams(window.location.search);
const telegramId = urlParams.get('telegram_id');

if (!telegramId) {
    alert('Ошибка: не удалось получить ID пользователя.');
    throw new Error('Telegram ID не найден.');
}

// Функция для загрузки данных из Firestore
async function loadScheduleData() {
    try {
        const docRef = doc(db, 'business_questionnaire', `${telegramId}_Business`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('Данные из Firestore:', data); // Отладочное сообщение

            // Проверяем, есть ли поле operating_mode
            if (data.operating_mode && typeof data.operating_mode === 'object') {
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

                days.forEach(day => {
                    const timeRange = data.operating_mode[day] || '';
                    console.log(`День: ${day}, Время: ${timeRange}`); // Отладочное сообщение

                    if (timeRange) {
                        const [startTime, endTime] = timeRange.split(' - ');
                        if (startTime && endTime) {
                            document.getElementById(`${day}-start`).value = startTime.trim();
                            document.getElementById(`${day}-end`).value = endTime.trim();
                        }
                    }
                });
            } else {
                console.warn('Поле operating_mode отсутствует или имеет неправильный формат.');
            }
        } else {
            console.warn('Документ не найден в Firestore.');
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// Загружаем данные при открытии страницы
loadScheduleData();

// Обработчик отправки формы
const form = document.getElementById('schedule-form');
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Собираем данные о режиме работы
    const scheduleData = {
        monday: `${document.getElementById('monday-start').value} - ${document.getElementById('monday-end').value}`,
        tuesday: `${document.getElementById('tuesday-start').value} - ${document.getElementById('tuesday-end').value}`,
        wednesday: `${document.getElementById('wednesday-start').value} - ${document.getElementById('wednesday-end').value}`,
        thursday: `${document.getElementById('thursday-start').value} - ${document.getElementById('thursday-end').value}`,
        friday: `${document.getElementById('friday-start').value} - ${document.getElementById('friday-end').value}`,
        saturday: `${document.getElementById('saturday-start').value} - ${document.getElementById('saturday-end').value}`,
        sunday: `${document.getElementById('sunday-start').value} - ${document.getElementById('sunday-end').value}`,
    };

    try {
        // Обновляем документ в Firestore
        const docRef = doc(db, 'business_questionnaire', `${telegramId}_Business`);
        await updateDoc(docRef, { operating_mode: scheduleData });

        // Уведомляем пользователя об успешном сохранении
        alert('Режим работы успешно сохранен!');

        // Закрываем мини-приложение
        tg.close();
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
        alert('Произошла ошибка при сохранении данных.');
    }
});