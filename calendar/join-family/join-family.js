import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
export const db = getFirestore(app);

// Функция для обработки подключения к семейному календарю
async function joinFamily() {
    // Проверяем, что страница загружена внутри Telegram Mini App
    if (!window.Telegram || !Telegram.WebApp) {
        alert('Эта страница работает только внутри Telegram Mini App.');
        return;
    }

    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const familyId = urlParams.get('familyId');

    // Элемент для отображения статуса
    const statusElement = document.getElementById('status');

    if (!familyId) {
        statusElement.textContent = 'Ошибка: неверная ссылка. Убедитесь, что ссылка корректна.';
        return;
    }

    // Получаем telegram_id пользователя, который нажал на ссылку
    const telegramId = Telegram.WebApp.initDataUnsafe.user?.id;

    if (!telegramId) {
        statusElement.textContent = 'Ошибка: необходимо авторизоваться через Telegram.';
        return;
    }

    try {
        // Проверяем, существует ли семейный календарь
        const familyDoc = await getDoc(doc(db, 'family_calendars', familyId));
        if (!familyDoc.exists()) {
            statusElement.textContent = 'Ошибка: семейный календарь не найден.';
            return;
        }

        // Проверяем, что пользователь ещё не подключен
        const familyData = familyDoc.data();
        if (familyData.members.includes(telegramId)) {
            statusElement.textContent = 'Вы уже подключены к этому семейному календарю.';
            return;
        }

        // Добавляем пользователя в семейный календарь
        await updateDoc(doc(db, 'family_calendars', familyId), {
            members: arrayUnion(telegramId),
        });

        // Обновляем документ пользователя в коллекции calendars
        await updateDoc(doc(db, 'calendars', `${telegramId}_Base`), {
            family_calendar: familyId, // Добавляем поле family_calendar
            is_family_member: true, // Устанавливаем флаг is_family_member в true
        });

        statusElement.textContent = 'Вы успешно подключились к семейному календарю!';
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    } catch (error) {
        console.error('Ошибка при подключении к семейному календарю:', error);
        statusElement.textContent = 'Произошла ошибка при подключении. Попробуйте позже.';
    }
}

// Вызываем функцию при загрузке страницы
joinFamily();