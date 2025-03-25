import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, setDoc, doc, serverTimestamp, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";


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
const db = getFirestore(app);

// Получаем элементы DOM
const createCalendarBtn = document.getElementById('create-calendar-btn');
const createCalendarForm = document.getElementById('create-calendar-form');
const submitCalendarBtn = document.getElementById('submit-calendar-btn');
const calendarNameInput = document.getElementById('calendar-name');

// Получаем telegram_id пользователя
const telegramId = Telegram.WebApp.initDataUnsafe.user?.id;
if (!telegramId) {
    console.error("Ошибка: telegram_id не найден.");
}

// Обработчик нажатия на кнопку "Создать календарь"
createCalendarBtn.addEventListener('click', () => {
    console.log('Кнопка "Создать календарь" нажата');
    createCalendarForm.style.display = 'block';
    createCalendarForm.classList.remove('form-hidden');
    createCalendarForm.classList.add('form-visible');
});

// Обработчик нажатия на кнопку "Создать"
submitCalendarBtn.addEventListener('click', async () => {
    const calendarName = calendarNameInput.value.trim();

    if (!calendarName) {
        alert('Пожалуйста, введите имя календаря.');
        return;
    }

    if (!telegramId) {
        alert('Ошибка: не удалось получить telegram_id.');
        return;
    }

    // Формируем calendar_id
    const calendarId = `${telegramId}_${calendarName}`.replace(/\//g, "_");

    try {
        // Проверяем, существует ли уже документ с таким calendar_id в коллекции "calendars"
        const calendarDocRef = doc(db, 'calendars', calendarId); // Используем calendar_id как ID документа
        const calendarDoc = await getDoc(calendarDocRef);

        if (calendarDoc.exists()) {
            // Если документ с таким calendar_id уже существует, выводим ошибку
            alert('Календарь с таким именем уже существует.');
            return;
        }
    

        // Создаем новый документ в коллекции "calendars" с ID, равным calendar_id
        await setDoc(calendarDocRef, {
            calendar_id: calendarId,
            telegram_id: telegramId,
            calendar_name: calendarName,
            created_at: serverTimestamp() // Используем serverTimestamp() для времени создания
        });

        console.log('Календарь успешно создан в коллекции calendars:', calendarId);

        // Проверяем, существует ли уже запись с таким telegramId в коллекции "basic_calendar"
        const basicCalendarDocRef = doc(db, 'basic_calendar', telegramId.toString()); // Убедимся, что telegramId является строкой
        const basicCalendarDoc = await getDoc(basicCalendarDocRef);

        if (!basicCalendarDoc.exists()) {
            // Если записи с таким telegramId нет, добавляем новую запись в "basic_calendar"
            try {
                await setDoc(basicCalendarDocRef, {
                    name: telegramId.toString(), // Убедимся, что telegramId является строкой
                    telegram_id: telegramId,
                    calendar_id: calendarId,
                    calendar_name: calendarName,
                    created_at: serverTimestamp() // Используем serverTimestamp() для времени создания
                });

                console.log('Запись в basic_calendar успешно создана с ID:', telegramId);
                alert('Календарь успешно создан и запись в basic_calendar добавлена!');
            } catch (error) {
                console.error('Ошибка при создании записи в basic_calendar:', error);
                alert('Произошла ошибка при создании записи в basic_calendar.');
            }
        } else {
            console.log('Запись с таким telegram_id уже существует в basic_calendar');
            alert('Запись с таким telegram_id уже существует в basic_calendar.');
        }
    } catch (error) {
        console.error('Ошибка при создании календаря:', error);
        alert('Произошла ошибка при создании календаря.');
    }
});