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
const calendarSelect = document.getElementById('calendar-select');
const saveMainCalendarBtn = document.getElementById('save-main-calendar-btn');
const openCalendarBtn = document.getElementById('open-calendar-btn');
const calendarIdText = document.getElementById('calendar-id-text'); // Элемент для отображения calendar_id

if (!calendarSelect || !saveMainCalendarBtn || !openCalendarBtn || !calendarIdText) {
    console.error("Ошибка: элементы DOM не найдены.");
}

// Получаем telegram_id пользователя
const telegramId = Telegram.WebApp.initDataUnsafe.user?.id;
if (!telegramId) {
    console.error("Ошибка: telegram_id не найден.");
}

// Функция для загрузки календарей
const loadCalendars = async () => {
    console.log("Загрузка календарей...");
    calendarSelect.innerHTML = '<option value="" disabled selected>Выберите календарь</option>';

    const q = query(collection(db, "calendars"), where("telegram_id", "==", telegramId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("Календари не найдены.");
        return;
    }

    querySnapshot.forEach((doc) => {
        const calendarName = doc.data().calendar_name;
        const calendarId = doc.data().calendar_id;
        console.log(`Найден календарь: ${calendarName} (ID: ${calendarId})`);

        const option = document.createElement('option');
        option.value = calendarId;
        option.textContent = calendarName;
        calendarSelect.appendChild(option);
    });

    // Принудительное обновление интерфейса
    Telegram.WebApp.ready();
};

// Загружаем календари при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadCalendars();
});

// Обработчик изменения выбора календаря
calendarSelect.addEventListener('change', () => {
    const selectedCalendarId = calendarSelect.value;

    if (selectedCalendarId) {
        // Обновляем текст с calendar_id
        calendarIdText.textContent = selectedCalendarId;
    } else {
        // Если календарь не выбран, показываем "Не выбран"
        calendarIdText.textContent = "Не выбран";
    }
});

// Обработчик нажатия на кнопку "Открыть календарь"
openCalendarBtn.addEventListener('click', () => {
    const selectedCalendarId = calendarSelect.value;

    if (!selectedCalendarId) {
        alert("Пожалуйста, выберите календарь.");
        return;
    }

    // Перенаправляем пользователя на страницу календаря с выбранным calendar_id
    window.location.href = `./calendar?calendar_id=${selectedCalendarId}`;
});