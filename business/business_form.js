import { db, doc, setDoc, getDoc, updateDoc } from './firebase.js';

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем mini app на весь экран

// Получаем telegram_id пользователя
const telegramId = tg.initDataUnsafe.user?.id;

if (!telegramId) {
    alert('Ошибка: не удалось получить ID пользователя.');
    throw new Error('Telegram ID не найден.');
}

// Получаем фото пользователя (если доступно)
const userPhoto = tg.initDataUnsafe.user?.photo_url || '';

// Функция для загрузки данных из Firestore
async function loadBusinessData() {
    try {
        const docRef = doc(db, 'business_questionnaire', `${telegramId}_Business`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // Заполняем поля формы, если данные есть
            document.getElementById('name').value = data.name || '';
            document.getElementById('address').value = data.address || '';
            document.getElementById('category').value = data.category || '';
            document.getElementById('info').value = data.info || '';
            document.getElementById('phone').value = data.phone || '';
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// Загружаем данные при открытии страницы
loadBusinessData();

// Обработчик отправки формы
const form = document.getElementById('business-form');
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Собираем данные из формы
    const businessData = {
        name: document.getElementById('name').value,
        address: document.getElementById('address').value,
        category: document.getElementById('category').value,
        foto: userPhoto, // Используем фото из Telegram
        info: document.getElementById('info').value,
        phone: document.getElementById('phone').value,
    };

    try {
        const docRef = doc(db, 'business_questionnaire', `${telegramId}_Business`);
        const docSnap = await getDoc(docRef);

        // Проверяем, существует ли документ
        if (docSnap.exists()) {
            // Если документ существует, обновляем его
            await updateDoc(docRef, businessData);
        } else {
            // Если документ не существует, создаем новый
            await setDoc(docRef, businessData);
        }

        // Переходим на следующую страницу
        window.location.href = `business_services.html?telegram_id=${telegramId}`;
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
        alert('Произошла ошибка при сохранении данных.');
    }
});